export const DOMAINS = [
  {
    slug: 'digital-vlsi',
    name: 'Digital VLSI',
    icon: 'chip',
    tagline: 'From RTL to silicon',
    summary: 'RTL design, verification and FPGA prototyping.',
    about:
      'We write Verilog, build small processors and find out what really happens between a passing testbench and a clean timing report. Sessions cover logic design, synthesis, static timing and the open source chip flow, with an FPGA board on the table most weeks.',
    tools: ['Verilog', 'SystemVerilog', 'Vivado', 'Yosys', 'OpenLane', 'Icarus', 'GTKWave'],
    does: ['RISC-V core builds on FPGA', 'Verification with self-checking testbenches', 'Tape-out style flow with open PDKs'],
  },
  {
    slug: 'analog-vlsi',
    name: 'Analog VLSI',
    icon: 'wave',
    tagline: 'Transistor level thinking',
    summary: 'Amplifiers, references, oscillators and data converters.',
    about:
      'Hand calculations first, simulator second. We size transistors for gain and bandwidth, chase down noise and mismatch, and layout small blocks the way a foundry expects them. Good for anyone who enjoys circuits more than code.',
    tools: ['SPICE', 'Cadence Virtuoso', 'LTspice', 'ngspice', 'Xschem', 'Magic'],
    does: ['Op-amp and bandgap design', 'Ring oscillators and PLL blocks', 'ADC / DAC architecture study'],
  },
  {
    slug: 'embedded',
    name: 'Embedded Systems',
    icon: 'board',
    tagline: 'Firmware that touches the world',
    summary: 'Microcontrollers, sensors, RTOS and custom boards.',
    about:
      'Anything with a microcontroller and a purpose. We read datasheets, write drivers, schedule tasks under an RTOS and design our own PCBs. Projects usually end up on a desk, a drone or a robot.',
    tools: ['STM32', 'ESP32', 'Arduino', 'FreeRTOS', 'Zephyr', 'KiCad'],
    does: ['Bare metal drivers and bootloaders', 'Sensor fusion and control loops', 'Custom PCB design and bring-up'],
  },
  {
    slug: 'communication',
    name: 'Communication Systems',
    icon: 'antenna',
    tagline: 'Signals through the air',
    summary: 'Modulation, coding, antennas and software defined radio.',
    about:
      'We model links in MATLAB and Python, then try to receive the real thing with an SDR. Expect a lot of spectrum plots, a few antennas built from copper wire and some honest arguments about Nyquist.',
    tools: ['MATLAB', 'GNU Radio', 'RTL-SDR', 'LoRa', 'NS-3', 'Python'],
    does: ['Digital modulation simulations', 'SDR receivers for weather and aircraft signals', 'LoRa sensor networks'],
  },
];

export const domainBySlug = (slug) => DOMAINS.find((d) => d.slug === slug);
export const domainName = (slug) => domainBySlug(slug)?.name ?? '';

export const POSITIONS = ['Secretary', 'Deputy Secretary', 'Lead'];

export const BRANCHES = [
  'Electrical Engineering',
  'Computer Science and Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Engineering Physics',
  'Materials Engineering',
  'Mathematics and Computing',
  'Other',
];
