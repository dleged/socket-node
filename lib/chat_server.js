var socketio = require('socket.io');
var io;
var guestNumber = 0;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server){
	//启动Socket IO服务，允许它搭载已有的http服务器上
	io = socketio.listen(server);
	console.log('#####：socekt已启动!/n')
	io.set('log level',1);
	
	//定义每个用户连接的处理逻辑
	io.sockets.on('connection',function(socket){
		
		//新进一个用户递增一个Guest + guestNumber用户名
		guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);
		
		//在用户连接上来时把他放入聊天室Lobby里
		joinRoom(socket,'Lobby');
		
		//处理用户的消息，更名，以及聊天室的创建和变更
		handleMessageBroadcasting(socket, nickNames);
	    handleNameChangeAttempts(socket, nickNames, namesUsed);
	    handleRoomJoining(socket);
		
		//用户发出请求时候，向其提供已经被占用的聊天室的列表
		socket.on('getRooms', function() {
	      	socket.emit('rooms', io.sockets.manager.rooms);
	    });
		
		handleClientDisconnection(socket,nickNames,namesUsed);
		
		socket.emit('msg', {rp:"fine,thank you"})
	});
}

//新进一个用户递增一个Guest + guestNumber用户名
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
	  var name = 'Guest' + guestNumber;
	  nickNames[socket.id] = name;
	  socket.emit('nameResult', {
	    success: true,
	    name: name
	  });
	  namesUsed.push(name);
	  console.log(name);
	  return guestNumber + 1;
	  
	 
}

//进入聊天室
function joinRoom(socket,room){
	socket.join(room);//用户进入房间
	currentRoom[socket.id] = room;//记录用户当前房间
	socket.emit('joinResult',{room:room});//让用户知道他们的房间
	
	//通知其他用户房间有新人进入
	socket.broadcast.to(room).emit('message',{
		text: nickNames[socket.id] + ' has joined ' + room + '.'
	});
	console.log(nickNames[socket.id] + ' has joined ' + room + '.');
	//汇总房间里都有谁
	var usersInRoom = io.sockets.clients(room);
	if(usersInRoom.length > 1){
		var usersInRoomSummary = 'Users currently in ' + room + ' ：';
		for(var index in usersInRoom){
			var userSocketId = usersInRoom[index].id;
			if(userSocketId != socket.id){
				if(index > 0){
					usersInRoomSummary += ', ';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		usersInRoomSummary += '.';
		socket.emit('message',{text: usersInRoomSummary});
	}
}

/*用户更名*/
function handleNameChangeAttempts(socket,nickNames,namesUsed){
	socket.on('nameAttempt',function(name){
		/*不能以Gguest开头*/
		if(name.indexOf('Guest') === 0){
			socket.emit('nameResult',{
				success: false,
				message: 'Name cannot begin with "Guest."'
			})
		}else{
			/*用户名不存在*/
			if(namesUsed.indexOf(name) === -1){
				var previousName = nickNames[socket.id];
				var previousNameIdex = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;			
				delete namesUsed[previousNameIdex];//删除之前的用户名
			}else{/*用户名存在*/
				socket.emit('nameResult',{
					success: false,
					message: 'That name is aleadly in used.'
				})
			}
		}
	});
}

/*服务器端 Socket.IO的broadcast函数是用来转发消息*/
function handleMessageBroadcasting(socket,nickNames){
	socket.on('message',function(message){
		socket.broadcast.to(message.room).emit('message',{
			text: nickNames[socket.id]+ ': '+ message.text
		});
	})
}

/*实现更换房间的功能*/
function handleRoomJoining(socket){
	socket.on('join',function(room){
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket,room.newRoom);
	});
}

/*用户离开房间*/
function handleClientDisconnection(socket,nickNames,namesUsed){
	socket.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		//通知其他用户房间有用户离开房间
		socket.broadcast.to(currentRoom[socket.id]).emit('message',{
			text: nickNames[socket.id] + ' has levea ' + currentRoom[socket.id] + '.'
		});
		delete currentRoom[socket.id]
		delete nickNames[socket.id];
		delete namesUsed[nameIndex];
		
	});
}
