const express = require('express');
const socket = require('socket.io');

const app = express();
let liveClients = {};
let waitingClients = [];
let repairClients = [];

server = app.listen(5000, function(){
    console.log('server is running on port 5000')
});

io = socket(server);

io.on('connection', (socket) => {
    //console.log(socket.id);

    // handle when the client emits 'ADD_USER'
    handleAddUser(socket);

    // handle when the client emits 'SEND_MESSAGE'
    handleAddMessage(socket);

    // handle when the client emits 'DELETE_USER'
    handleDeleteUser(socket);
});

function arrayRemove(array, element) {
    const index = array.indexOf(element);
    
    if (index !== -1) {
        array.splice(index, 1);
    }
}

function setRandomPartner(clientName, partnerList){
   // if(repairClients){

   // }
   let partnerName;
   if(partnerList.length === 1){
       return;
   } else if(partnerList.length === 2){
        partnerName = partnerList[1];
    } else if(partnerList.length > 2){
        let index = (Math.floor(Math.random()*(partnerList.length -1)) +1);
        partnerName = partnerList[index];        
    }

    liveClients[clientName].socket.emit('USER_CONNECTED', partnerName);
    liveClients[clientName].partner = partnerName;

    liveClients[partnerName].socket.emit('USER_CONNECTED', clientName);
    liveClients[partnerName].partner = clientName;

    arrayRemove(waitingClients, clientName);
    arrayRemove(waitingClients, partnerName);

}

function connectRandomClients(){
    if(waitingClients.length > 1){
        let clientName = waitingClients[0];
        setRandomPartner(clientName, waitingClients);
    }
}

function rePairClients(){
    let clientName = repairClients[0];
    let waitingClientsCopy = waitingClients;
    //delete waitingClientsCopy[repairClients[0].partner];
    setRandomPartner(clientName, waitingClientsCopy);
}

function handleAddUser(socket){
    socket.on('ADD_USER',function(name, cb) {
        let matched = Object.keys(liveClients).filter(function(key) {
            return key === name;
        })
        if(matched.length > 0) {
            cb('UserTaken');
            return;
        } else {
            //store the username in the socket session for this client
            socket.username = name;
            waitingClients.push(name);
            liveClients[name] = {
                "id": socket.id,
                "socket": socket,
                "timeoutIds": [],
                "partner" : ""
            };
            connectRandomClients();
            cb('');
        }

    });
}
  
function handleAddMessage(socket){
    socket.on('SEND_MESSAGE', function(name, message) {
        let msg = message ? message.trim() : "";
        let msgParts = msg ? msg.split(' ') : null;
        if(msgParts && msgParts[0] && (msgParts[0].toUpperCase() === "/DELAY")){
            let time = msgParts[1];
            msg = msg.substr((time.length + 7));
            let tId = setTimeout(function(){
                            let pUser = liveClients[socket.username].partner;                    
                            let id = liveClients[pUser].id;
                            io.sockets.connected[id].emit("UPDATE_CHAT", socket.username, msg);
                        }, time);
            liveClients[socket.username].timeoutIds.push(tId);
        } else if(msgParts[0] && (msgParts[0].toUpperCase() === "/HOP")){
            // rePairClients()
        } else {
            let pUser = liveClients[socket.username].partner;
            let id = liveClients[pUser].id;
            io.sockets.connected[id].emit("UPDATE_CHAT", socket.username, message);    
        }

    });    
}

function handleDeleteUser(socket){
    socket.on('DELETE_USER',function(name) {
        arrayRemove(waitingClients, name);
        delete liveClients[name];
    });
}