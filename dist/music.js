const ap = new APlayer({
    container: document.getElementById('aplayer'),
    fixed: true,
    autoplay: false,
	volume: 0.6
    audio: [
      {
        name: "You are my sunshine",
        artist: 'Elizabeth Mitchell',
        url: 'http://music.163.com/song/media/outer/url?id=2533578.mp3',
        cover: 'https://s1.ax1x.com/2020/03/18/8dQvnI.th.jpg',
      },
      {
        name: 'Shallow',
        artist: 'Lady Gaga/Bradley Cooper',
        url: 'http://music.163.com/song/media/outer/url?id=1313096578.mp3',
        cover: 'https://s1.ax1x.com/2020/03/18/8d1EGD.th.jpg',
		lrc: 'D:\GitHub\Shallow - Lady Gaga,Bradley Cooper.lrc',
      },
    ]
});