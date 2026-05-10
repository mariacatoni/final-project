/**
 * Rich popup content for specific concert dates. Images stay under `assets/<YYYY-MM-DD>/`;
 * journal source `.rtf` files live under `unused-files/assets/<YYYY-MM-DD>/` (not loaded by the site).
 * Text is synced from those RTFs via `scripts/sync-rich-details-from-rtf.py` when you run it.
 * (RTF control codes are stripped at build time.)
 *
 * @typedef {{ kind: "image"; src: string; alt: string }} RichImageSlide
 * @typedef {{ kind: "youtube"; videoId: string; title: string }} RichYoutubeSlide
 * @typedef {RichImageSlide | RichYoutubeSlide} RichSlide
 * @typedef {{ lead?: string; bodyParagraphs: string[]; slides: RichSlide[] }} EventRichDetail
 */

/** @type {Record<string, EventRichDetail>} */
export const EVENT_RICH_DETAILS = {
  "2000-04-07": {
    lead: "Attended with my dad, my sister, and my sister’s friends",
    bodyParagraphs: [
      "Big events such as concerts with international artists were not common growing up in Puerto Rico. Being able to see one of my favorite bands, The Cranberries, felt like a once in a lifetime opportunity (it later turned out to be thrice in a lifetime). I was only 12 at the time, but knowing my 17-year-old sister and I had been big fans for years, my dad agreed to take us to the show. I was by far one of the youngest audience members.",
      "Unfortunately for me it was that day that I learned about standing concerts, though I hope that in my excitement I didn’t complain too much. A favorite unexpected moment was when the band played their cover of Fleetwod Mac’s Go Your Own Way, which was also my introduction to Fleetwood Mac."
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
      "I was very online as a teenager in the early 2000s which has shaped many of my interests over my life. When I was around 14, I discovered Japanese music, and specifically j-rock, through web forums.  One of my favorite bands was (and still is) Dir en grey. The band was formed in 1997 and is still together, having just released their 12th album in April of 2026. I hardly dreamed while living in Puerto Rico that I’d ever get to see them live.",
      "I was in college in Savannah, GA when the band began to expand to international markets and did their first headlining tour in the US with a stop in Atlanta. My sister and I went to the show along with our friend Brittany (who we’d met through online forums years before). This was my first concert where I stood in the pit and I was not ready for the crush of being pushed in all directions at once. It was also where I learned about concert fashion while being massively out of place in a crowd of extravagant looks.",
      "This concert made all three of us lifelong fans of the band and was only the first of many we attended together."
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
  "2008-03-28": {
    lead: "Attended with Brittany",
    bodyParagraphs: [
      "In 2007, my friend Brittany, my sister, and I began a swear jar of sorts where we’d put a dollar every time we said a word from a list of banned words. By 2008 our savings had grown to over $200 (an amount I found impressive as a college student and retail worker). Our plan was to save it for next time all three of us wanted to travel for a concert.",
      "In March 2008, the Taste of Chaos tour made a stop 6 hours away in Orlando, FL. The tour featured emo, pop punk, and hardcore bands that were popular at the time.\nBrittany and I decided we wanted to go. A friend had just accepted a job near Orlando and could put us up for the night, so all we needed was money for our concert tickets the Greyhound bus. We had no other savings, so we had the genius idea to take money from the shared fund and replace it before my sister noticed.",
      "I enjoyed the shows, met some of the artists, and made great memories. But I mostly remember trying frantically to make enough money to replace the shared fund when, only a few months later, Dir en grey announced a tour and all of us, including my sister, wanted to go. We managed to replace the savings and keep the secret of the “borrowed” funds for another ten or so years."
    ],
    slides: [],
  },
  "2011-03-20": {
    lead: "Attended with Alison and Jim",
    bodyParagraphs: [
      "I met my friend Alison on a web forum when we were about 12 years old. She lived in Virginia while I lived in Puerto Rico. We kept in touch through our high school years, met in person in 2005, then went our separate ways for most of our college years.",
      "In 2011, Alison, who was in Philadelphia  at the time, asked if I’d like to meet up again as she and her boyfriend would be in town for Royksopp’s show. I was also a fan and joined them for the show. It was an unusually relaxed crowd and we were able to pick a spot by the stage despite not arriving particularly early. I didn’t know what to expect having never seen a concert in this genre, and I was surprised at the theatricality of some of the costuming and movement.",
      "This show also marked a rekindling of my friendship with Alison, who moved to New York the following year and has remained a close friend since. We’ve also gone to many more shows together, including a second Royksopp show, Perfume, The Last Rockstars, XG, and others."
    ],
    slides: [
      {
        kind: "youtube",
        videoId: "skSTIF0740A",
        title: "YouTube: Röyksopp — related live footage",
      },
    ],
  },
  "2012-03-25": {
    lead: "Attended with someone I don’t talk to anymore",
    bodyParagraphs: [
      "My favorite band when I first learned about j-rock was L’arc~en~ciel. In my teens, friends and I obsessed over the band’s frontman, hyde. In 2004 they played their first show in the US. I happened to be in the country at the time, but in a different state, and thought I had missed my opportunity to ever see them.",
      "In 2012, I had a fresh chance to see the band when they announced their only other show to date in the continental US in Madison Square Garden. The show opened with one of my all time favorite tracks, Ibara no Namida, and followed with a mix of classics I’d been listening to for the last 12 years and newer songs.",
      "With how rare a chance this was, I’m thankful that I was in the right city at the right time to see one of the bands that shaped my youth."
    ],
    slides: [
      {
        kind: "image",
        src: "assets/2012-03-25/20120325-01.jpg",
        alt: "L'Arc-en-Ciel concert photo, Madison Square Garden, March 25, 2012",
      },
      {
        kind: "image",
        src: "assets/2012-03-25/20120325-2.jpg",
        alt: "L'Arc-en-Ciel concert photo, Madison Square Garden, March 25, 2012",
      },
      {
        kind: "youtube",
        videoId: "FrjoqD-azPg",
        title: "YouTube: L'Arc-en-Ciel — related concert footage",
      },
    ],
  },
  "2019-10-19": {
    lead: "Attended with Benny",
    bodyParagraphs: [
      "2019 was one of my biggest years for concerts. One of the many shows I got to attend was Lady Gaga’s Vegas residency, Enigma. My friend and former roommate Benny and I purchased our tickets more than a year ahead of the show and spent the next 14 months planning for our trip.",
      "One of my biggest regrets is not attending Lady Gaga’s shows earlier in her career. I was always a fan, but my enthusiasm didn’t solidify until 2016, when the release of her Joanne album was perfectly timed with a low period in my life. This show was a celebration of her whole career and gave me an opportunity to see many of my favorites I’d missed out on before, such as Judas, Aura, and Dance in the Dark. Outside the show, we visited a free exhibit showcasing past costumes and props, including a replica of the famous meat dress (not pictured) and the headpiece from Telephone (pictured).",
      "We followed the next day with her second residency show, Jazz & Piano. Though it was a great showcase of her talents, we realized quickly we’re more pop music fans when Benny almost took a nap."
    ],
    slides: [
      {
        kind: "image",
        src: "assets/2019-10-19/20191019-2.jpg",
        alt: "Lady Gaga Enigma residency, Las Vegas, October 2019",
      },
      {
        kind: "image",
        src: "assets/2019-10-19/20191019-3.jpg",
        alt: "Lady Gaga Enigma residency, Las Vegas, October 2019",
      },
      {
        kind: "image",
        src: "assets/2019-10-19/20191019-4.jpg",
        alt: "Lady Gaga Enigma residency, Las Vegas, October 2019",
      },
      {
        kind: "image",
        src: "assets/2019-10-19/20191019-extra.jpg",
        alt: "Lady Gaga Enigma residency, Las Vegas, October 2019",
      },
      {
        kind: "image",
        src: "assets/2019-10-19/20191020-1.jpg",
        alt: "Lady Gaga exhibit costumes and props, Las Vegas, October 2019",
      },
    ],
  },
  "2019-12-13": {
    lead: "Attended solo",
    bodyParagraphs: [
      "I went to this concert by myself after 8 years of not seeing Dir en grey and thinking I’d probably never go again, having moved on to other music genres. It was a rainy day and I had just adopted my cat, so I nearly went home after work. I’m glad I did because I didn’t realize this was the last normal concert I’d have before a pandemic ruined everything for some time.",
      "Though I attempted to brave the pit as in old times, I nearly had my shirt pulled off at one point and decided it’d be best to stand towards the back for once. Being used to a younger version of the band, I was also taken by how much more confidently they all carried themselves now well into their 40s, and how their fashion had evolved."
    ],
    slides: [
      {
        kind: "image",
        src: "assets/2019-12-13/20191213-1.jpg",
        alt: "Dir en grey concert, December 13, 2019",
      },
      {
        kind: "image",
        src: "assets/2019-12-13/20191213-2.jpg",
        alt: "Dir en grey concert, December 13, 2019",
      },
      {
        kind: "image",
        src: "assets/2019-12-13/20191213-3.jpg",
        alt: "Dir en grey concert, December 13, 2019",
      },
    ],
  },
  "2021-10-01": {
    lead: "Attended with Ky and Bryan",
    bodyParagraphs: [
      "In 2020, I spent my birthday completely by myself in my apartment. In addition to Zoom calls from friends, the only highlight of the day was the release of Charli’s pandemic album, how I’m feeling now. Music was one of the few joys available to me that year, despite the obvious lack of live events.",
      "My first concert since the start of the pandemic was Charli’s show for this album, which I attended with my friend Ky and her husband. Only three shows were held in London, New York, and LA, all in low capacity venues. We were among the lucky few who were able to score tickets. I wore my mask, paired it with a dose of crowd anxiety, and set out to have the best time I possibly could under the circumstances."
    ],
    slides: [
      {
        kind: "youtube",
        videoId: "9nYiIc6ZiHo",
        title: "YouTube: Charli XCX — Pink Diamond at Le Poisson Rouge, New York 2021",
      },
    ],
  },
  "2022-08-27": {
    lead: "Attended with Carlos",
    bodyParagraphs: [
      "You have to really want it to see a popular artist post-pandemic. Tickets for Bad Bunny’s Un Verano Sin Ti tour went on sale while I was in an appointment, so I told my friend Carlos that I would trust him to make a decision on what to buy. He scored us the most expensive concert tickets of my life (at that point) for the very last row of the topmost stands at Yankee Stadium.",
      "It’s debatable whether it was money well spent, but I don’t regret it. Though our view was far from the best, being all the way back meant we had a full view of the audience, one of the liveliest I’ve seen. Bad Bunny’s set ran for 3 hours after start time with songs spanning his entire career. Being in recovery from a recent ankle sprain didn’t stop me from dancing (almost) the entire time. The back far back row also meant we had a nice breeze through the fencing behind us, a huge perk on a miserably hot summer day. I realized I can have the best time of my life in the crappiest seats available."
    ],
    slides: [
      {
        kind: "image",
        src: "assets/2022-08-27/20220827-1.jpg",
        alt: "Bad Bunny tour, Yankee Stadium, August 27, 2022",
      },
      {
        kind: "image",
        src: "assets/2022-08-27/20220827-2.jpg",
        alt: "Bad Bunny tour, Yankee Stadium, August 27, 2022",
      },
      {
        kind: "image",
        src: "assets/2022-08-27/20220827-3.jpg",
        alt: "Bad Bunny tour, Yankee Stadium, August 27, 2022",
      },
    ],
  },
  "2024-09-18": {
    lead: "Attended with Ari",
    bodyParagraphs: [
      "In July 2024, I visited my friend Roseanne in London. We visited k-pop stores, where nothing was of my particular interest. Yet, k-pop albums are extravagant and we wanted the experience of opening some together, so I picked out albums by I-dle (at the time known as (G)I-DLE), a group I was somewhat familiar with.",
      "I didn’t plan to dive head first into becoming a fan of the group, but I admired them after learning they are one of the few groups in the industry to write and produce their music. By the time I returned to the US, I was ready to purchase a ticket to their upcoming tour. I cancelled my existing plans day and purchased a ticket for this show instead. Roseanne’s friend Ari, who I’d never met before, became my concert friend for the evening.",
      "It was my first time attending an arena show for a single k-pop group, so I celebrated the occasion with the band’s lightstick and a photo card. Even the ride to this show was memorable. During my ride on the LIRR, I knew where to go by following the fans wearing teal wigs to cosplay the group. I became a bigger fan after the concert and have channeled much of my enthusiasm for music towards them since."
    ],
    slides: [
      {
        kind: "image",
        src: "assets/2024-09-18/20240918-1.jpg",
        alt: "(G)I-DLE concert, September 18, 2024",
      },
      {
        kind: "image",
        src: "assets/2024-09-18/20240918-2.jpg",
        alt: "(G)I-DLE concert, September 18, 2024",
      },
      {
        kind: "image",
        src: "assets/2024-09-18/20240918-3.jpg",
        alt: "(G)I-DLE concert, September 18, 2024",
      },
      {
        kind: "image",
        src: "assets/2024-09-18/20240918-4.jpg",
        alt: "(G)I-DLE concert, September 18, 2024",
      },
      {
        kind: "image",
        src: "assets/2024-09-18/20240918-5.jpg",
        alt: "(G)I-DLE concert, September 18, 2024",
      },
    ],
  },
  "2025-04-09": {
    lead: "Attended with my sister and Brittany",
    bodyParagraphs: [
      "April 8th and 9th of 2025 was our most recent time seeing Dir en grey. This time the band did not tour across the US, but played 3 nights in California. After constant tours in the 2000s and 2010s, and nothing yet in the 2020s, anticipation was high for many fans and tickets sold out right away. Luckily, I found out the day the announcement and presale went live and got enough for all of us before word spread.",
      "This night, my sister and I stayed in the back to watch the full stage from a distance rather than entering the pit to have limited views and constant pushing. My sister is shorter, so we traded spots so she could have a better view. Unexpectedly (as we were so far back), a pick one of the guitarists threw landed on her at the end of the show. I will never stop annoying her about how that could’ve been my pick.",
      "It doesn’t seem likely that the band will return to the US again. After the show, the singer asked fans to come see them in Japan next time. Maybe I can do that someday instead."
    ],
    slides: [
      {
        kind: "image",
        src: "assets/2025-04-09/20250409-1.jpg",
        alt: "Dir en grey concert, April 9, 2025",
      },
      {
        kind: "image",
        src: "assets/2025-04-09/20250409-2.jpg",
        alt: "Dir en grey concert, April 9, 2025",
      },
    ],
  },
}

/**
 * @param {string} isoDate `YYYY-MM-DD`
 * @returns {EventRichDetail | undefined}
 */
export function getRichDetailForDate(isoDate) {
  return EVENT_RICH_DETAILS[isoDate];
}
