import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import LiteYouTubeEmbed  from 'react-lite-youtube-embed'
import sound from '../sound.png';

import "./om.scss";
const containerStyle = {
  display: "flex",
  flexDirection: "row", // Changed to a row layout
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  width: "100%",
 
  color: "#fff",
  textAlign: "center",
};

const videoContainerStyle = {
  flexDirection: "row",
  flex: 1,
  width: "100%",// Take up the available space
};

const playerStyle = {
  width: "100%",
};

const youtubeVideoListStyle = {
  float: 'right',

  
  width: "650px",
  height: "500px", // Fixed width for the video list
 
  // Note the use of camelCase for marginTop
  overflowY: "auto",
 
};

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="container">
    {remoteSocketId ?<h1></h1>: <h1 style={{ alignItems:"center"}}>Room Page</h1>}
     <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>  
   <div className="buttons--list" >
   {  remoteSocketId && <button className="custom-btn style-02" onClick={handleCallUser}>
         <span>Call</span>
       </button> }
     {myStream && <button className="custom-btn style-03" onClick={sendStreams}>
         <span>Send Stream</span>
       </button> }
     </div>
     <div className="header">
       <div className="row">
         <div className="col">
           <div className="col-1">
             <div className="joined">
               My Video
              
    {myStream && (
           <>
             
             <ReactPlayer
               className= "host-img"
               playing
               muted={!isMuted}
               height="70%"
               width="70%"
               style={{ display: "block" }}
               url={myStream}
             />
           </>
         )}
   
             </div>
           </div>
           <div className="col-1">
           <div className="joined">
            Stranger Video
            {remoteStream && (
              <>
                <h1>Remote Stream</h1>
                <div className="video-wrapper">
                  <ReactPlayer
                    playing
                    muted={!isMuted}
                    height="70%"
                    width="70%"
                    style={{ display: "block" }}
                    url={myStream}
                    className="host-img"
                  />
                  <button onClick={() => setIsMuted(!isMuted)}>
                    <img src={sound} alt="Mute/Unmute" />
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
              </>
            )}
          </div>
           </div>
         </div>
         <div className="col-1">
           <div className="joined2">
             YouTube PlayList
    <div style={youtubeVideoListStyle}>
         
           {/* Here, you can add your YouTube video components in a scrollable list */}
           <ReactPlayer  className="host-img" url={'https://www.youtube.com/watch?v=7KDRqBpT8NA&ab_channel=JSSolutions'}/> 
           <br></br>
           <ReactPlayer  className="host-img" url={'https://www.youtube.com/watch?v=7KDRqBpT8NA&ab_channel=JSSolutions'}/> 
           <br></br>
           <ReactPlayer className="host-img" url={'https://www.youtube.com/watch?v=7KDRqBpT8NA&ab_channel=JSSolutions'}/> 
           <br></br>
           <ReactPlayer  className="host-img" url={'https://www.youtube.com/watch?v=7KDRqBpT8NA&ab_channel=JSSolutions'}/>
           <br></br> 
           <ReactPlayer  className="host-img" url={'https://www.youtube.com/watch?v=7KDRqBpT8NA&ab_channel=JSSolutions'}/> 
           {/* Add more video components as needed */}
         </div>
             
           </div>
         </div>
       </div>
     </div>
   </div>
   
         
        
   
     
  );
};

export default RoomPage;
