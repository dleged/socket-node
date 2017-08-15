/***服务器端***/
使用socket.io -- listen(http的server);
io.on('connection',function(socket));//监听客户端连接,回调函数会传递本次连接的socket
io.sockets.emit('String',data);//给所有客户端广播消息
io.sockets.socket(socketid).emit('String', data);//给指定的客户端发送消息
socket.on('String',function(data));//监听客户端发送的信息
socket.emit('String', data);//给该socket的客户端发送消息


/***客户端***/
建立一个socket与服务器连接
var socket = io.connect('http://192.168.9.56:8000/');
socket.on('msg',function(data){
	//监听服务消息
	socket.emit('msg', {rp:"fine,thank you"}); 
	//向服务器发送消息
	console.log(data);
});

注意：socket 的任何事件如msg，服务器端的emit不会触发on的msg事件，客户端亦如此。
