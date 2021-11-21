var video = document.querySelector("#video");
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
          video.srcObject = stream;
        })
        .catch(function (err0r) {
          console.log("Something went wrong!");
        });
    }
    document.getElementById("cap").addEventListener('click' , function() {
      var canvas = document.getElementById('canvas');     
      var video = document.getElementById('video');
      canvas.width = 500;
      canvas.height = 400;
      canvas.getContext('2d').drawImage(video, 0, 0, 500,400);  
      document.getElementById("img64capture").value = canvas.toDataURL();
    });

    document.getElementById("cap-1").addEventListener('click' , function(){
      document.getElementById("webcam").classList.toggle("hide");
      document.getElementById("waiting").classList.toggle("hide");
    });

    //document.getElementById("animatedimage").src = "https://i.gifer.com/QHTn.gif";