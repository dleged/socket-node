/*用来显示系统创建的受信内容*/
function divEscapedContentElement(message){
	return $('<div></div>').text(message);
}

function divSystemContentElement(message){
	return $('<div></div>').html('<i>' + message + '</i>');
}

/*处理原始的用户输入*/
function processUserInput(chatApp, socket) {
  var message = $('#send-message').val();
  var systemMessage;

  if (message.charAt(0) == '/') {
		systemMessage = chatApp.processCommand(message);
	if (systemMessage) {
  		$('#messages').append(divSystemContentElement(systemMessage));
    }
  	} else {
	    chatApp.sendMessage($('#room').text(), message);
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
  	}

  $('#send-message').val('');
}

// socket连接到服务器
var socket = io.connect('http://192.168.9.56:8000/');
console.dir(socket);
$(document).ready(function(){
	var chatApp = new Chat(socket);
	
	//更名结果
	socket.on('nameResult',function(result){
		var message;
		
		if(result.success){
			message = 'Your are now know as ' + result.name + '.';
		}else{
			message = 'result.message';
		}
		
		$('#messages').append(divSystemContentElement(message));
	});
	
	//显示房间变更结果
	socket.on('joinResult', function(result) {
	    $('#room').text(result.room);
	    $('#messages').append(divSystemContentElement('Room changed.'));
	});
	
	//显示接收到的消息
	socket.on('message', function (message) {
	    var newElement = $('<div></div>').text(message.text);
	    $('#messages').append(newElement);
    });
	
	//显示可用房间列表
	socket.on('rooms',function(rooms){
		$('#room-list').empty();
		for(var room in rooms){
			room = room.substring(1,room.length);
			if(room != ''){
				 $('#room-list').append(divEscapedContentElement(room));
			}
		}
		//点击切换房间
		$('#room-list div').click(function(){
			chatApp.processCommand('/join ' + $(this).text());
			$('#send-message').focus();
			$('#messages').scrollTop($('#messages').prop('scrollHeight')+20);
		});
	});
	//定期查看可用房间列表
	setInterval(function(){
		/*触发chat_server.js 的
		socket.on('getRooms', function() {
	      	socket.emit('rooms', io.sockets.manager.rooms);//
	    });*/
		socket.emit('getRooms');
	},1000);
	$('#send-message').focus();
	
	//提交表单发送消息
	$('#send-form').submit(function(){
		processUserInput(chatApp,socket);
		return false;
	});

	//监听msg事件
	socket.on('msg',function(data){
			console.log(222);
		});
	
});
