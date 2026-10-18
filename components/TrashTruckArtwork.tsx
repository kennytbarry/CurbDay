interface TrashTruckArtworkProps {
  className?: string;
  mirrored?: boolean;
}

/**
 * Detailed side-profile vector illustration of a municipal automated-loader
 * refuse truck lifting a curbside cart, styled with crisp cel-shaded linework
 * and 2026 Padres City Connect accents.
 */
export default function TrashTruckArtwork({
  className = "w-72 h-44",
  mirrored = false,
}: TrashTruckArtworkProps) {
  // Helper to render a realistic heavy-duty truck wheel with 12 tread lugs, rim, and hub bolts
  const renderWheel = (cx: number, cy: number) => (
    <g key={cx} transform={`translate(${cx}, ${cy})`}>
      {/* Outer treaded tire */}
      <circle r="24" fill="#181C24" stroke="#090C12" strokeWidth="2.5" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x="-3.5"
          y="-26"
          width="7"
          height="4"
          rx="1"
          fill="#181C24"
          stroke="#090C12"
          strokeWidth="1.5"
          transform={`rotate(${i * 30})`}
        />
      ))}
      {/* Tire sidewall shadow */}
      <circle r="19" fill="#232936" stroke="#090C12" strokeWidth="1.5" />
      {/* Steel wheel rim */}
      <circle r="12.5" fill="#94A3B8" stroke="#090C12" strokeWidth="2" />
      <circle r="9" fill="#64748B" stroke="#090C12" strokeWidth="1.5" />
      {/* Hub cap & lug nuts */}
      <circle r="4.5" fill="#334155" stroke="#090C12" strokeWidth="1.5" />
      {Array.from({ length: 8 }).map((_, i) => (
        <circle
          key={i}
          cx="0"
          cy="-6.8"
          r="1"
          fill="#090C12"
          transform={`rotate(${i * 45})`}
        />
      ))}
    </g>
  );

  return (
    <svg
      viewBox="0 0 440 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Stylized curbside collection truck illustration"
      className={className}
    >
      <g transform={mirrored ? "translate(440, 0) scale(-1, 1)" : undefined}>
        {/* Ground shadow */}
      <ellipse cx="228" cy="226" rx="182" ry="9" fill="#050811" opacity="0.65" />

      {/* Motion arc lines behind the lifted cart */}
      <path
        d="M92 64C106 38 132 22 162 18"
        stroke="#BCE3F5"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M106 68C118 46 138 33 162 29"
        stroke="#FFB703"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.65"
      />

      {/* Top Hopper Opening & Canopy Shield */}
      <path
        d="M206 68L216 84H294L304 68H206Z"
        fill="#1E2942"
        stroke="#090C12"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Forward Canopy over Cab */}
      <path
        d="M306 72H320L368 88V94H306V72Z"
        fill="#1E6B7B"
        stroke="#090C12"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Exhaust & Air Intake Stack (between body and cab) */}
      <rect
        x="304"
        y="92"
        width="16"
        height="78"
        fill="#111827"
        stroke="#090C12"
        strokeWidth="2.5"
      />
      <path
        d="M316 102V88C316 84 319 82 323 82"
        stroke="#64748B"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect
        x="311"
        y="100"
        width="11"
        height="52"
        rx="2"
        fill="#475569"
        stroke="#090C12"
        strokeWidth="2"
      />
      <circle
        cx="320"
        cy="152"
        r="7.5"
        fill="#475569"
        stroke="#090C12"
        strokeWidth="2"
      />

      {/* Main Compactor Body (Center & Left) */}
      <rect
        x="104"
        y="76"
        width="202"
        height="94"
        fill="#16808D"
        stroke="#090C12"
        strokeWidth="2.5"
      />
      {/* Upper highlight band on compactor body */}
      <rect
        x="104"
        y="76"
        width="202"
        height="12"
        fill="#2299A8"
        stroke="#090C12"
        strokeWidth="2"
      />

      {/* Horizontal Structural Ribs on Right Hopper Section */}
      <rect
        x="222"
        y="98"
        width="78"
        height="7"
        rx="2"
        fill="#2299A8"
        stroke="#090C12"
        strokeWidth="1.75"
      />
      <rect
        x="222"
        y="118"
        width="78"
        height="7"
        rx="2"
        fill="#2299A8"
        stroke="#090C12"
        strokeWidth="1.75"
      />
      <rect
        x="222"
        y="138"
        width="78"
        height="7"
        rx="2"
        fill="#2299A8"
        stroke="#090C12"
        strokeWidth="1.75"
      />

      {/* Vertical Structural Columns on Compactor Body */}
      <rect
        x="130"
        y="76"
        width="8"
        height="94"
        fill="#2299A8"
        stroke="#090C12"
        strokeWidth="2"
      />
      <rect
        x="176"
        y="76"
        width="8"
        height="94"
        fill="#2299A8"
        stroke="#090C12"
        strokeWidth="2"
      />
      <rect
        x="216"
        y="72"
        width="8"
        height="98"
        fill="#2299A8"
        stroke="#090C12"
        strokeWidth="2"
      />
      <rect
        x="298"
        y="72"
        width="8"
        height="98"
        fill="#2299A8"
        stroke="#090C12"
        strokeWidth="2"
      />

      {/* Subtle Recycling & Bin Icons on Side Panels */}
      <g transform="translate(145, 114)" opacity="0.9">
        <circle
          cx="12"
          cy="12"
          r="11"
          fill="#BCE3F5"
          fillOpacity="0.2"
          stroke="#BCE3F5"
          strokeWidth="1.75"
          strokeDasharray="5 3"
        />
        <path
          d="M12 6L16 12H8L12 6ZM7 16L12 13L17 16H7Z"
          fill="#BCE3F5"
        />
      </g>
      <g transform="translate(190, 115)" opacity="0.9">
        <rect
          x="3"
          y="6"
          width="14"
          height="16"
          rx="1.5"
          fill="#BCE3F5"
          fillOpacity="0.25"
          stroke="#BCE3F5"
          strokeWidth="1.5"
        />
        <line x1="1" y1="6" x2="19" y2="6" stroke="#BCE3F5" strokeWidth="2" />
        <line x1="7" y1="10" x2="7" y2="19" stroke="#BCE3F5" strokeWidth="1.5" />
        <line x1="10" y1="10" x2="10" y2="19" stroke="#BCE3F5" strokeWidth="1.5" />
        <line x1="13" y1="10" x2="13" y2="19" stroke="#BCE3F5" strokeWidth="1.5" />
      </g>

      {/* Angled Rear Tailgate Hopper (Left End) */}
      <path
        d="M66 68H106V174L88 188H66L44 156V102L66 68Z"
        fill="#13636E"
        stroke="#090C12"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M96 68H106V174L92 188H84L96 172V68Z"
        fill="#2299A8"
        stroke="#090C12"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Top Rear Beacons */}
      <rect
        x="68"
        y="71"
        width="5"
        height="7"
        rx="2"
        fill="#FF8800"
        stroke="#090C12"
        strokeWidth="1.5"
      />
      <rect
        x="86"
        y="71"
        width="5"
        height="7"
        rx="2"
        fill="#FF8800"
        stroke="#090C12"
        strokeWidth="1.5"
      />
      {/* Rear Tailgate Ribbed Bar */}
      <rect
        x="42"
        y="116"
        width="44"
        height="9"
        rx="2"
        fill="#16808D"
        stroke="#090C12"
        strokeWidth="2"
      />
      {/* Rear Yellow/Black Hazard Chevron Bar */}
      <rect
        x="44"
        y="142"
        width="44"
        height="11"
        rx="1.5"
        fill="#FFB703"
        stroke="#090C12"
        strokeWidth="2"
      />
      <path
        d="M52 143L47 147.5L52 152M60 143L55 147.5L60 152M74 143L79 147.5L74 152M82 143L87 147.5L82 152"
        stroke="#090C12"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rear Tail Lights & Bumper */}
      <rect
        x="54"
        y="174"
        width="36"
        height="11"
        rx="2"
        fill="#1E2942"
        stroke="#090C12"
        strokeWidth="2"
      />
      <rect x="57" y="176" width="8" height="7" rx="1" fill="#D81B60" />
      <rect x="65" y="176" width="6" height="7" rx="1" fill="#FFB703" />
      <rect x="74" y="176" width="8" height="7" rx="1" fill="#D81B60" />
      <rect x="82" y="176" width="6" height="7" rx="1" fill="#FFB703" />

      {/* Lower Body Skirt & Tandem Rear Fender */}
      <rect
        x="106"
        y="156"
        width="110"
        height="16"
        fill="#1E3A5F"
        stroke="#090C12"
        strokeWidth="2"
      />
      <rect
        x="118"
        y="162"
        width="9"
        height="4"
        rx="2"
        fill="#FFB703"
        stroke="#090C12"
        strokeWidth="1.25"
      />
      <rect
        x="196"
        y="162"
        width="9"
        height="4"
        rx="2"
        fill="#FFB703"
        stroke="#090C12"
        strokeWidth="1.25"
      />
      {/* Rear Fender Arch */}
      <path
        d="M110 184L124 170H214L228 184H110Z"
        fill="#2299A8"
        stroke="#090C12"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Chassis Frame & Cylindrical Fuel/Hydraulic Tank */}
      <rect
        x="220"
        y="170"
        width="105"
        height="18"
        fill="#0F172A"
        stroke="#090C12"
        strokeWidth="2"
      />
      <rect
        x="236"
        y="177"
        width="62"
        height="25"
        rx="5"
        fill="#64748B"
        stroke="#090C12"
        strokeWidth="2.25"
      />
      <rect
        x="252"
        y="176"
        width="6"
        height="27"
        fill="#CBD5E1"
        stroke="#090C12"
        strokeWidth="1.5"
      />
      <rect
        x="282"
        y="176"
        width="6"
        height="27"
        fill="#CBD5E1"
        stroke="#090C12"
        strokeWidth="1.5"
      />

      {/* Right-Facing Cab-Over-Engine (COE) Truck Cab */}
      <path
        d="M326 98H382C389 98 394 102 396 109L404 142V188H326V98Z"
        fill="#FAF8F5"
        stroke="#090C12"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Cab Marigold + Magenta City Connect Livery Stripe */}
      <path
        d="M332 146H362L372 154H404V164H368L358 156H332V146Z"
        fill="#FF8800"
        stroke="#090C12"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M332 144H363L373 152H404"
        stroke="#D81B60"
        strokeWidth="2.5"
      />
      {/* Cab Side Window */}
      <path
        d="M356 108H388L393 134H368L362 128H356V108Z"
        fill="#7DD3FC"
        stroke="#090C12"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Window Glass Sheen */}
      <path
        d="M364 110L376 132M372 110L382 128"
        stroke="#E0F2FE"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Lower Door Visibility Window */}
      <rect
        x="374"
        y="146"
        width="16"
        height="19"
        rx="2.5"
        fill="#7DD3FC"
        stroke="#090C12"
        strokeWidth="1.75"
      />
      {/* Side Mirror & Bracket */}
      <path
        d="M385 106H393V138H384"
        stroke="#090C12"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="390"
        y="110"
        width="5"
        height="22"
        rx="2"
        fill="#1E293B"
        stroke="#090C12"
        strokeWidth="1.75"
      />
      {/* Door Handle & Vertical Grab Bar */}
      <rect
        x="342"
        y="108"
        width="4"
        height="34"
        rx="2"
        fill="#E2E8F0"
        stroke="#090C12"
        strokeWidth="1.5"
      />
      <rect
        x="350"
        y="148"
        width="6"
        height="5"
        rx="1"
        fill="#1E293B"
        stroke="#090C12"
        strokeWidth="1.5"
      />
      {/* Headlight & Turn Signal */}
      <rect
        x="397"
        y="166"
        width="7"
        height="9"
        rx="1.5"
        fill="#FFB703"
        stroke="#090C12"
        strokeWidth="1.75"
      />
      {/* Front Fender Arch & Entry Steps & Front Bumper */}
      <path
        d="M308 198C308 174 326 160 348 160C370 160 386 174 388 198H308Z"
        fill="#1E3A5F"
        stroke="#090C12"
        strokeWidth="2.5"
      />
      <rect
        x="376"
        y="182"
        width="32"
        height="18"
        rx="2.5"
        fill="#475569"
        stroke="#090C12"
        strokeWidth="2.25"
      />
      <line x1="378" y1="191" x2="398" y2="191" stroke="#090C12" strokeWidth="2" />

      {/* 3 Heavy-Duty Treaded Truck Wheels */}
      {renderWheel(142, 200)}
      {renderWheel(196, 200)}
      {renderWheel(348, 200)}

      {/* Tilted Wheeled Curbside Cart Being Lifted into Hopper */}
      <g transform="translate(154, 16) rotate(34)">
        {/* Open Hinged Cart Lid */}
        <path
          d="M2 0L46 -22L48 -16L6 4Z"
          fill="#22C55E"
          stroke="#090C12"
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
        {/* Cart Body */}
        <path
          d="M0 4H46L41 64H5L0 4Z"
          fill="#16A34A"
          stroke="#090C12"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Cart Upper Rim */}
        <rect
          x="-2"
          y="0"
          width="50"
          height="6"
          rx="2"
          fill="#22C55E"
          stroke="#090C12"
          strokeWidth="2"
        />
        {/* Recycling Emblem on Cart */}
        <circle
          cx="23"
          cy="28"
          r="8"
          fill="#FAF8F5"
          fillOpacity="0.2"
          stroke="#FAF8F5"
          strokeWidth="1.5"
        />
        {/* Cart Bottom Wheel */}
        <circle
          cx="34"
          cy="64"
          r="8.5"
          fill="#1E293B"
          stroke="#090C12"
          strokeWidth="2.25"
        />
        <circle cx="34" cy="64" r="3.5" fill="#94A3B8" />
      </g>

      {/* Automated Side-Loader Mechanical Arm & Hydraulic Cylinders */}
      {/* Upper Grabber Clamp gripping the cart */}
      <path
        d="M148 52L174 78L168 85L142 58Z"
        fill="#FF8800"
        stroke="#090C12"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Secondary Linkage Strut */}
      <path
        d="M182 90L242 106L282 74L287 80L244 114L178 97Z"
        fill="#94A3B8"
        stroke="#090C12"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Hydraulic Piston Cylinder (Upper) */}
      <path
        d="M192 86L246 98"
        stroke="#FF8800"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M192 86L246 98"
        stroke="#090C12"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.25"
      />
      {/* Main Diagonal Boom Arm with Hazard Stripes */}
      <path
        d="M180 96L240 112L308 164L298 174L232 122L176 105Z"
        fill="#CBD5E1"
        stroke="#090C12"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      {/* Hazard Chevron Decal on Main Boom */}
      <path
        d="M254 126L276 143L271 149L249 132Z"
        fill="#FFB703"
        stroke="#090C12"
        strokeWidth="1.5"
      />
      {/* Lower Hydraulic Lift Cylinder */}
      <path
        d="M234 172L268 148"
        stroke="#FF8800"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Base Pivot Joint on Chassis */}
      <circle
        cx="298"
        cy="168"
        r="8"
        fill="#FF8800"
        stroke="#090C12"
        strokeWidth="2.25"
      />
      <circle cx="298" cy="168" r="3" fill="#090C12" />
      <circle
        cx="238"
        cy="115"
        r="5.5"
        fill="#CBD5E1"
        stroke="#090C12"
        strokeWidth="2"
      />
      </g>
    </svg>
  );
}
