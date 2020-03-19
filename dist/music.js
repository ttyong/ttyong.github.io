const ap = new APlayer({
    container: document.getElementById('aplayer'),
    fixed: true,
    autoplay: false,
	theme: '#FADFA3',
	volume: 0.7,
	//lrcType: 3,
	preload: 'none',
    audio: [
      {
        name: "You are my sunshine",
        artist: 'Elizabeth Mitchell',
        url: 'http://music.163.com/song/media/outer/url?id=2533578.mp3',
        cover: 'https://s1.ax1x.com/2020/03/18/8dQvnI.th.jpg',
		lrc: 'https://github.com/ttyong/lrc/blob/master/You%20Are%20My%20Sunshine%20-%20Elizabeth%20Mitchell.lrc',
      },
      {
        name: 'Shallow',
        artist: 'Lady Gaga/Bradley Cooper',
        url: 'http://music.163.com/song/media/outer/url?id=1313096578.mp3',
        cover: 'https://s1.ax1x.com/2020/03/18/8d1EGD.th.jpg',
		lrc: 'https://github.com/ttyong/lrc/blob/master/Shallow%20-%20Lady%20Gaga%2CBradley%20Cooper.lrc',
      },
	  {
        name: "I'm Gonna Getcha Good",
        artist: 'Shania Twain',
        url: 'http://music.163.com/song/media/outer/url?id=476081660.mp3',
        cover: 'https://imgchr.com/i/8rs9Ld',
		lrc: 'https://github.com/ttyong/lrc/blob/master/Shallow%20-%20Lady%20Gaga%2CBradley%20Cooper.lrc',
      },
	  {
        name: "Fire",
        artist: 'Gavin Degraw',
        url: 'http://music.163.com/song/media/outer/url?id=28923579.mp3',
        cover: 'https://s1.ax1x.com/2020/03/19/8rsH1S.jpg',
		lrc: 'https://github.com/ttyong/lrc/blob/master/Shallow%20-%20Lady%20Gaga%2CBradley%20Cooper.lrc',
      },
    ]
});
