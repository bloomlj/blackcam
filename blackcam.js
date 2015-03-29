//for five
var five = require("johnny-five");
var Edison = require("galileo-io");
var board = new five.Board({io:new Edison()});


//for fswebcam
var fs = require('fs');
var Camelittle = require('camelittle');
var clInstance = new Camelittle({
	device: '/dev/video0',
	resolution:'1280x720',
	frames:5,
	'no-banner':null
});
var fs = require('fs');
var dateFormat = require('dateformat');
var now = new Date();
var datestring = dateFormat(now, "yyyy-dd-mm-HH-MM-ss");
var options = {
    https : false,
    host : 'www.xiachejian.com',
    port : 80,
    path : '/xmlrpc.php'
  }



var rpc = require('wordpress-rpc'); 
var wp = new rpc(options);  


board.on("ready", function() {

    var temperature = new five.Temperature({
      controller: "TMP36",
      pin: "A0"
    });

    
  // Create a new `motion` hardware instance.
  var motion = new five.IR.Motion(7);

  // "calibrated" occurs once, at the beginning of a session,
  motion.on("calibrated", function() {
    console.log("calibrated");
  });

  // "motionstart" events are fired when the "calibrated"
  // proximal area is disrupted, generally by some form of movement
  motion.on("motionstart", function() {
    console.log("motionstart");
      
    var now_temperature = 0;
    temperature.on("data", function(err, data) {
        //console.log(data.celsius + "°C", data.fahrenheit + "°F");
        now_temperature = data.celsius;
    });
      
    clInstance.grab(function(err, image){
        console.log("get image");
    	fs.writeFileSync('/home/bloomlj/blackcam/video0.jpg', image, 'binary');

                //upload
          var parameter4 = [
            1,
            'bloomlj',         //set your username
            'ysyhl9t.bloomlj',          //set your password
              {'name':datestring+'-video0.jpg',
               'type':'image/jpeg',
               'bits':fs.readFileSync('/home/bloomlj/blackcam/video0.jpg')
               //'bits':image
              }
          ];

          wp.call('wp.uploadFile', parameter4, function(err, data_upload){
            console.log(JSON.stringify(data_upload));
            console.log(data_upload.methodResponse.params[0].url);  
              var image_id = data_upload.methodResponse.params[0].id;

              //new post with upload
              var parameter5 = [
                1,
                'username',         //set your username
                'password',          //set your password
                  {'post_type':'post',
                   'post_status':'publish',
                   'post_title':'SWJTU Makerspace Real View',
                   //'post_author':'',
                   'post_excerpt':'Just Test Excerpt',
                   'post_content':"#"+dateFormat(now, "yyyy-mm-dd HH:MM:ss")+"@SWJTU Makerspace：我是机器人小黑盒，主人派我来实时播报现在空间的环境。现在的气温是："+now_temperature+"摄氏度，相对湿度是百分之20%(还没有启用)，我还拍了一张，地址在"+data_upload.methodResponse.params[0].url,
                   'post_format':'image',
                   "post_thumbnail":image_id
                  }
              ];

              wp.call('wp.newPost', parameter5, function(err, data_edit){
                console.log(JSON.stringify(data_edit));
              });

          });
        
        
    });
  });

  // "motionend" events are fired following a "motionstart" event
  // when no movement has occurred in X ms
  motion.on("motionend", function() {
    console.log("motionend");
  });
})