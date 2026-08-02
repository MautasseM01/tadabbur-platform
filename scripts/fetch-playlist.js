const { Innertube } = require('youtubei.js');
const fs = require('fs');

async function scrape() {
  const yt = await Innertube.create();
  const playlist = await yt.getPlaylist('PLbBj8LNBJwR_5sEqu4bRSatFRxRRcOpFJ');
  
  const videos = playlist.items.map((item, idx) => ({
    id: 'v_anbiya_' + idx,
    surahId: 21,
    ayahNumber: 1, // We will just map them temporarily or by parsing the title
    youtubeId: item.id,
    startTime: 0,
    title: item.title.text,
    scholar: "د. فاضل السامرائي"
  }));
  
  console.log(JSON.stringify(videos, null, 2));
}
scrape().catch(console.error);
