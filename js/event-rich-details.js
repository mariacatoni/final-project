/**
 * Rich popup content for specific concert dates (from `assets/<YYYY-MM-DD>/` RTF + images).
 * Text matches the `.rtf` sources in each folder (RTF control codes removed).
 *
 * @typedef {{ kind: "image"; src: string; alt: string }} RichImageSlide
 * @typedef {{ kind: "youtube"; videoId: string; title: string }} RichYoutubeSlide
 * @typedef {RichImageSlide | RichYoutubeSlide} RichSlide
 * @typedef {{ lead: string; bodyParagraphs: string[]; slides: RichSlide[] }} EventRichDetail
 */

/** @type {Record<string, EventRichDetail>} */
export const EVENT_RICH_DETAILS = {
  "2000-04-07": {
    lead: "Attended with my dad, my sister, and my sister's friends",
    bodyParagraphs: [
      "Big events such as concerts with international artists were not common growing up in Puerto Rico. Being able to see one of my favorite bands, The Cranberries, felt like a once in a lifetime opportunity (it later turned out to be thrice in a lifetime). I was only 12 at the time, but knowing my 17-year-old sister and I had been big fans for years, my dad agreed to take us to the show. I was by far one of the youngest audience members.",
      "Unfortunately for me it was that day that I learned about standing concerts, though I hope that in my excitement I didn't complain too much. A favorite unexpected moment was when the band played their cover of Fleetwod Mac's Go Your Own Way, which was also my introduction to Fleetwood Mac.",
    ],
    slides: [
      {
        kind: "image",
        src: "assets/2000-04-07/20000407.jpg",
        alt: "Photo from The Cranberries concert, April 7, 2000",
      },
      {
        kind: "youtube",
        videoId: "ls6ih7Sw5h4",
        title: "YouTube: The Cranberries — related concert footage",
      },
    ],
  },
  "2007-02-03": {
    lead: "Attended with my sister and Brittany",
    bodyParagraphs: [
      "I was a very online teenager in the early 2000s which has shaped many of my interests over my life. Then I was around 14, I discovered Japanese music, and specifically j-rock, through web forums.  One of my favorite bands was (and still is) Dir en grey. The band was formed in 1997 and is still together, having just released their 12th album in April of 2026. I hardly dreamed while living in Puerto Rico that I'd ever get to see them live.",
      "I was in college in Savannah, GA when the band began to expand to international markets and did their first headlining tour in the US with a stop in Atlanta. My sister and I went to the show along with our friend Brittany (who we'd met in one of our online forums years before). This was my first concert where I stood in the pit and I was not ready for the crush of being pushed in all directions at once.",
      "This concert made all three of us lifelong fans of the band and was only the first of many we attended together.",
    ],
    slides: [
      {
        kind: "image",
        src: "assets/2007-02-03/20070203-1.png",
        alt: "Concert photo, Dir en grey with Fair to Midland, February 3, 2007",
      },
      {
        kind: "image",
        src: "assets/2007-02-03/20070203-2.png",
        alt: "Concert photo, Dir en grey with Fair to Midland, February 3, 2007",
      },
      {
        kind: "youtube",
        videoId: "IrbVVbV2yDA",
        title: "YouTube: Dir en grey — related concert footage",
      },
    ],
  },
};

/**
 * @param {string} isoDate `YYYY-MM-DD`
 * @returns {EventRichDetail | undefined}
 */
export function getRichDetailForDate(isoDate) {
  return EVENT_RICH_DETAILS[isoDate];
}
