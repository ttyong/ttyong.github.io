const ap = new APlayer({
    container: document.getElementById('aplayer'),
    fixed: true,
    autoplay: false,
	theme: '#FADFA3',
	volume: 0.7,
	lrcType: 3,
	preload: 'none',
    audio: [
      {
        name: "You are my sunshine",
        artist: 'Elizabeth Mitchell',
        url: 'http://music.163.com/song/media/outer/url?id=2533578.mp3',
        cover: 'https://s1.ax1x.com/2020/03/18/8dQvnI.th.jpg',
		lrc: 'http://q7qhes5wq.bkt.clouddn.com/You%20Are%20My%20Sunshine%20-%20Elizabeth%20Mitchell.lrc',
      },
      {
        name: 'Shallow',
        artist: 'Lady Gaga/Bradley Cooper',
        url: 'http://music.163.com/song/media/outer/url?id=1313096578.mp3',
        cover: 'https://s1.ax1x.com/2020/03/18/8d1EGD.th.jpg',
		lrc: 'http://q7qhes5wq.bkt.clouddn.com/Shallow%20-%20Lady%20Gaga%2CBradley%20Cooper.lrc',
      },
	  {
        name: "I'm Gonna Getcha Good",
        artist: 'Shania Twain',
        url: 'http://music.163.com/song/media/outer/url?id=476081660.mp3',
        cover: 'https://imgchr.com/i/8rs9Ld',
		lrc: 'http://q7qhes5wq.bkt.clouddn.com/I%27m%20Gonna%20Getcha%20Good%20%28Green%20Version%29%20-%20Shania%20Twain.lrc',
      },
	  {
        name: "Fire",
        artist: 'Gavin Degraw',
        url: 'http://music.163.com/song/media/outer/url?id=28923579.mp3',
        cover: 'https://s1.ax1x.com/2020/03/19/8rsH1S.jpg',
		lrc: 'http://q7qhes5wq.bkt.clouddn.com/Fire%20-%20Gavin%20Degraw.lrc',
      },
    ]
});
