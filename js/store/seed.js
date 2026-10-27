import { config } from '../config.js';

// sample content for the offline preview only, nothing here reaches the real database

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

// abstract board-like artwork so the gallery has something to show
export function art(seed, w = 960, h = 640) {
  const r = rng(seed * 7919);
  const hues = [['#4bd991', '#34c0b4'], ['#34c0b4', '#1f7be8'], ['#1f7be8', '#7f8cff'], ['#4bd991', '#1f7be8']];
  const [c1, c2] = hues[seed % hues.length];
  let lines = '';
  for (let i = 0; i < 26; i++) {
    let x = Math.round(r() * w / 40) * 40;
    let y = Math.round(r() * h / 40) * 40;
    let d = `M${x} ${y}`;
    const segs = 3 + Math.floor(r() * 4);
    for (let s = 0; s < segs; s++) {
      if (r() > 0.5) x += (r() > 0.5 ? 1 : -1) * 40 * (1 + Math.floor(r() * 3));
      else y += (r() > 0.5 ? 1 : -1) * 40 * (1 + Math.floor(r() * 3));
      d += `L${x} ${y}`;
    }
    lines += `<path d="${d}" stroke="${r() > 0.5 ? c1 : c2}" stroke-opacity="${(0.25 + r() * 0.6).toFixed(2)}" stroke-width="2" fill="none"/><circle cx="${x}" cy="${y}" r="4" fill="${c1}"/>`;
  }
  const cx = w * (0.3 + r() * 0.4);
  const cy = h * (0.3 + r() * 0.4);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><radialGradient id="g" cx="${cx}" cy="${cy}" r="${w * 0.7}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c2}" stop-opacity=".34"/><stop offset="1" stop-color="#05080c"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>${lines}<rect x="${cx - 60}" y="${cy - 60}" width="120" height="120" rx="14" fill="#05080c" stroke="${c1}" stroke-width="3"/><rect x="${cx - 36}" y="${cy - 36}" width="72" height="72" rx="6" fill="${c2}" fill-opacity=".5"/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const day = 86400000;
const iso = (offsetDays, hour = 17) => {
  const d = new Date(Date.now() + offsetDays * day);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export function buildSeed() {
  const admin = config.previewAdmin;
  const members = [
    { email: admin, role: 'admin', name: 'Club Admin', roll_no: 'EE23BT041', batch: '2023', branch: 'Electrical Engineering', bio: 'Keeps the bench tidy and the website running.', skills: ['Verilog', 'KiCad'], domains: ['digital-vlsi', 'embedded'], github: '', linkedin: '', avatar_url: null, position: null, lead_domain: null },
    { email: 'electronicsclub@' + config.emailDomain, role: 'admin', name: 'Maanas Khatokar N', roll_no: '', batch: '2024', branch: 'Electronics and Communication Engineering', bio: '', skills: [], domains: ['digital-vlsi'], position: 'Secretary', lead_domain: null },
    { email: 'deputy@' + config.emailDomain, role: 'admin', name: 'Sample Deputy', roll_no: '', batch: '2023', branch: 'Electrical Engineering', bio: 'Placeholder entry for the deputy secretary.', skills: ['STM32'], domains: ['embedded'], position: 'Deputy Secretary', lead_domain: null },
    { email: 'lead.dvlsi@' + config.emailDomain, role: 'member', name: 'Sample Lead One', batch: '2022', branch: 'Electrical Engineering', bio: 'Placeholder entry for a domain lead.', skills: ['SystemVerilog', 'Vivado'], domains: ['digital-vlsi'], position: 'Lead', lead_domain: 'digital-vlsi' },
    { email: 'lead.avlsi@' + config.emailDomain, role: 'member', name: 'Sample Lead Two', batch: '2022', branch: 'Electrical Engineering', bio: 'Placeholder entry for a domain lead.', skills: ['SPICE', 'Virtuoso'], domains: ['analog-vlsi'], position: 'Lead', lead_domain: 'analog-vlsi' },
    { email: 'lead.emb@' + config.emailDomain, role: 'member', name: 'Sample Lead Three', batch: '2023', branch: 'Computer Science and Engineering', bio: 'Placeholder entry for a domain lead.', skills: ['FreeRTOS', 'ESP32'], domains: ['embedded'], position: 'Lead', lead_domain: 'embedded' },
    { email: 'lead.comm@' + config.emailDomain, role: 'member', name: 'Sample Lead Four', batch: '2022', branch: 'Electrical Engineering', bio: 'Placeholder entry for a domain lead.', skills: ['GNU Radio', 'MATLAB'], domains: ['communication'], position: 'Lead', lead_domain: 'communication' },
    { email: 'member@' + config.emailDomain, role: 'member', name: 'Preview Member', roll_no: '', batch: '2024', branch: 'Computer Science and Engineering', bio: 'Signed in through the preview switcher.', skills: ['Arduino', 'Python'], domains: ['embedded', 'communication'], position: null, lead_domain: null },
    { email: 'ee25bt004@' + config.emailDomain, role: 'member', name: null, roll_no: 'EE25BT004', batch: '2025', branch: '', bio: '', skills: [], domains: [], position: null, lead_domain: null },
    { email: 'member2@' + config.emailDomain, role: 'member', name: 'Sample Member Two', batch: '2024', branch: 'Engineering Physics', bio: '', skills: ['LTspice'], domains: ['analog-vlsi'], position: null, lead_domain: null },
    { email: 'member3@' + config.emailDomain, role: 'member', name: 'Sample Member Three', batch: '2025', branch: 'Mechanical Engineering', bio: '', skills: ['CAD', 'Arduino'], domains: ['embedded'], position: null, lead_domain: null },
  ].map((m) => ({ roll_no: '', github: '', linkedin: '', avatar_url: null, joined_at: iso(-120), ...m }));

  const projects = [
    { title: '8-bit CPU on an FPGA', domain: 'digital-vlsi', status: 'ongoing', year: 2026, featured: true, tech: ['Verilog', 'Vivado', 'Basys 3'], team: ['Sample Lead One', 'Club Admin'], summary: 'A small accumulator machine with its own assembler, running on a Basys 3 board.', description: 'The core has a 16 instruction set, a two stage pipeline and a UART for loading programs. We wrote the assembler in Python and a testbench that replays every instruction against a software model.\n\nNext up is adding interrupts and running a simple game from ROM.', repo_url: '', demo_url: '' },
    { title: 'Two stage CMOS op-amp', domain: 'analog-vlsi', status: 'completed', year: 2025, featured: true, tech: ['ngspice', 'Xschem', 'Magic'], team: ['Sample Lead Two'], summary: 'Miller compensated op-amp, sized by hand and verified across process corners.', description: 'Target was 60 dB gain with 10 MHz unity gain bandwidth on an open source PDK. Hand calculations got us close, the last iterations were corner sweeps and a lot of coffee.', repo_url: '', demo_url: '' },
    { title: 'Line following rover', domain: 'embedded', status: 'completed', year: 2025, featured: true, tech: ['STM32', 'FreeRTOS', 'KiCad'], team: ['Sample Lead Three', 'Preview Member'], summary: 'Custom PCB, PID steering and a task based firmware on an STM32 blue pill.', description: 'Sensor array, motor driver and the controller all live on one board we designed ourselves. Firmware splits into sensing, control and telemetry tasks.', repo_url: '', demo_url: '' },
    { title: 'Aircraft signal receiver', domain: 'communication', status: 'ongoing', year: 2026, featured: false, tech: ['RTL-SDR', 'GNU Radio', 'Python'], team: ['Sample Lead Four'], summary: 'Decoding 1090 MHz transponder signals with a USB dongle and a homemade antenna.', description: 'A quarter wave antenna cut from copper wire, a GNU Radio flowgraph and a decoder that plots what is flying over campus.', repo_url: '', demo_url: '' },
    { title: 'LoRa soil moisture network', domain: 'communication', status: 'planned', year: 2026, featured: false, tech: ['LoRa', 'ESP32'], team: [], summary: 'Battery powered sensor nodes reporting back to a single gateway.', description: 'Planned for the campus garden. Looking for people comfortable with low power firmware.', repo_url: '', demo_url: '' },
    { title: 'Bandgap reference study', domain: 'analog-vlsi', status: 'planned', year: 2026, featured: false, tech: ['SPICE'], team: [], summary: 'Learning group working through a temperature independent voltage reference.', description: 'Weekly paper reading with simulations to match.', repo_url: '', demo_url: '' },
  ].map((p, i) => ({ id: 'p' + i, cover_url: art(i + 3, 960, 600), created_at: iso(-60 + i * 3), ...p }));

  const albums = ['Workshops', 'Projects', 'Events', 'Workshops', 'Projects', 'Events', 'Workshops', 'Projects', 'Events', 'Projects'];
  const captions = ['Soldering workshop', 'Rover test run', 'Orientation evening', 'Oscilloscope basics', 'PCB first article', 'Chip design talk', 'Logic analyser demo', 'Antenna build', 'Open house', 'FPGA bring-up'];
  const photos = captions.map((c, i) => ({ id: 'ph' + i, url: art(i + 11, 900, i % 3 === 0 ? 1100 : 640), caption: c, album: albums[i], taken_on: iso(-200 + i * 14).slice(0, 10), featured: i < 4, created_at: iso(-200 + i * 14) }));

  const events = [
    { title: 'Soldering from scratch', domain: 'embedded', location: 'Electronics lab, Academic Block', starts_at: iso(6, 17), ends_at: iso(6, 19), description: 'Bring a laptop and nothing else. Irons, flux and a practice kit are provided. First timers welcome.', rsvp_open: true },
    { title: 'Reading a datasheet without fear', domain: null, location: 'Lecture Hall 2', starts_at: iso(13, 18), ends_at: iso(13, 19), description: 'A walk through three real datasheets and the three tables you should always check first.', rsvp_open: true },
    { title: 'Intro to the open source chip flow', domain: 'digital-vlsi', location: 'Computer Lab', starts_at: iso(-14, 17), ends_at: iso(-14, 19), description: 'RTL to GDS in two hours, using only free tools.', rsvp_open: false },
    { title: 'Orientation and bench tour', domain: null, location: 'Electronics lab', starts_at: iso(-75, 17), ends_at: iso(-75, 18), description: 'Meet the leads, see the lab and pick a domain.', rsvp_open: false },
  ].map((e, i) => ({ id: 'e' + i, cover_url: null, created_at: iso(-90), ...e }));

  const announcements = [
    { id: 'a0', title: 'Lab access hours updated', body: 'The electronics lab is open Monday to Friday, 4 pm to 8 pm. Sign the register at the door and put tools back where you found them.', pinned: true, created_by: admin, created_at: iso(-2) },
    { id: 'a1', title: 'Project proposals open', body: 'If you have an idea that fits one of the four domains, talk to the lead. Proposals are reviewed every second Friday.', pinned: false, created_by: admin, created_at: iso(-9) },
    { id: 'a2', title: 'Component order closes this week', body: 'Send your parts list to the deputy secretary before Friday so it goes into the bulk order.', pinned: false, created_by: admin, created_at: iso(-15) },
  ];

  const resources = [
    { id: 'r0', title: 'Verilog in one afternoon', url: 'https://www.asic-world.com/verilog/index.html', domain: 'digital-vlsi', kind: 'Tutorial', description: 'Quick reference for syntax and common patterns.' },
    { id: 'r1', title: 'Design of Analog CMOS Integrated Circuits', url: 'https://www.mhprofessional.com', domain: 'analog-vlsi', kind: 'Book', description: 'The standard text, borrow the club copy from the lab.' },
    { id: 'r2', title: 'STM32 reference manuals', url: 'https://www.st.com/en/microcontrollers-microprocessors/stm32-32-bit-arm-cortex-mcus.html', domain: 'embedded', kind: 'Datasheet', description: 'Manuals and application notes for the whole family.' },
    { id: 'r3', title: 'GNU Radio tutorials', url: 'https://wiki.gnuradio.org/index.php/Tutorials', domain: 'communication', kind: 'Tutorial', description: 'Start with the first four, they cover the flowgraph basics.' },
    { id: 'r4', title: 'KiCad getting started', url: 'https://docs.kicad.org', domain: null, kind: 'Docs', description: 'Schematic capture to Gerbers.' },
    { id: 'r5', title: 'Component ordering sheet', url: 'https://example.com', domain: null, kind: 'Sheet', description: 'Add what you need, the deputy secretary places the order.' },
  ].map((r) => ({ created_at: iso(-30), ...r }));

  return {
    members,
    projects,
    photos,
    events,
    announcements,
    resources,
    rsvps: [{ event_id: 'e0', email: 'member@' + config.emailDomain }],
    profile_changes: [
      { id: 'c0', email: 'member2@' + config.emailDomain, status: 'pending', note: null, submitted_at: iso(-1, 11), reviewed_by: null, reviewed_at: null, data: { name: 'Sample Member Two', bio: 'Second year, mostly interested in amplifier design and getting the lab oscilloscope to behave.', skills: ['LTspice', 'Oscilloscope'], github: 'github.com/example' } },
    ],
    join_requests: [
      { email: 'newstudent@' + config.emailDomain, name: 'New Student', message: 'Interested in embedded systems, have used Arduino for a semester.', status: 'pending', created_at: iso(-1, 9) },
    ],
    activity: [
      { id: 1, actor: admin, action: 'INSERT projects', target: '8-bit CPU on an FPGA', at: iso(-20, 12) },
      { id: 2, actor: admin, action: 'INSERT members', target: 'lead.dvlsi@' + config.emailDomain, at: iso(-18, 15) },
      { id: 3, actor: admin, action: 'INSERT events', target: 'Soldering from scratch', at: iso(-3, 10) },
    ],
  };
}
