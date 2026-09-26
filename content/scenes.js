// Umgebungen für die Videos. "recurring" = wiederkehrende Orte (sein Zuhause).
// poses: 'walk' = läuft auf die Kamera zu und spricht, 'sit' = sitzt und spricht.

const S = (id, setting, poses, recurring = false) => ({ id, setting, poses, recurring });

export const SCENES = [
  // Wiederkehrend
  S('penthouse', 'his luxury penthouse at night, warm table lamp, framed painting, huge window with blue night city skyline and falling snow', ['walk', 'sit'], true),
  S('trading-room', 'his dark trading room at night, several monitors with green and red candlestick charts, blue ambient light', ['walk', 'sit'], true),

  // Wechselnd
  S('snowy-rooftop', 'a snowy skyscraper rooftop at night, city lights far below, snowflakes in the air', ['walk']),
  S('supercar', 'the driver seat of a black luxury sports car parked in a neon lit city at night', ['sit']),
  S('private-jet', 'the leather seat of a private jet cabin, windows with clouds and sunset', ['sit']),
  S('ski-chalet', 'a cozy luxury ski chalet with a burning fireplace and snowy mountains outside the window', ['sit', 'walk']),
  S('night-street', 'a snowy city street at night with neon signs and glowing shop windows', ['walk']),
  S('hotel-lobby', 'a grand marble hotel lobby with golden chandeliers', ['walk']),
  S('gym', 'a premium modern gym at night with dim moody lighting and heavy weights', ['walk']),
  S('coffee-shop', 'a stylish minimalist coffee shop, warm lights, snow falling outside the window', ['sit']),
  S('parking-garage', 'an underground parking garage with a row of supercars and cold fluorescent lights', ['walk']),
  S('podcast-studio', 'a dark podcast studio with a professional microphone and warm LED strip lights', ['sit']),
  S('office-tower', 'a high rise glass office at dusk, city skyline behind him', ['walk']),
  S('train-first-class', 'a first class train cabin, snowy landscape rushing past the window', ['sit']),
  S('airport-lounge', 'a luxury airport lounge with planes visible through large windows at night', ['sit', 'walk']),
  S('library', 'an old grand library with tall wooden bookshelves and warm reading lamps', ['walk']),
  S('frozen-lake', 'the shore of a frozen lake at blue hour, snowy pine forest in the background', ['walk']),
  S('tokyo-crossing', 'a busy Tokyo street crossing at night with bright billboards and light snow', ['walk']),
  S('yacht', 'the deck of a luxury yacht in a harbor at night with city lights reflecting in the water', ['walk', 'sit']),
  S('mountain-lodge', 'the wooden balcony of a mountain lodge, snowy peaks and a starry sky', ['walk']),
  S('car-showroom', 'a bright luxury car showroom with polished sports cars', ['walk']),
  S('music-studio', 'a recording studio with a mixing desk and purple ambient lights', ['sit']),
  S('penthouse-pool', 'a heated rooftop pool at night with steam rising and city lights behind', ['walk']),
  S('boxing-gym', 'an old school boxing gym with a ring and hanging punching bags', ['walk']),
  S('limousine', 'the back seat of a limousine at night, city lights passing by the tinted windows', ['sit']),
  S('art-gallery', 'a minimalist white art gallery with large modern paintings', ['walk']),
  S('winter-market', 'a festive winter market at night with warm string lights and wooden stalls', ['walk']),
  S('home-office', 'a sleek modern home office with a large desk, laptop and a view of snowy trees', ['sit']),
];
