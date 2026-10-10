// Study guide map: which pages and topics of the Dion Training "CompTIA Network+ (N10-009) Study Guide"
// (study notes PDF, 477 pages) go with each video day of the 60-day plan.
// Derived from the guide's section and topic headings. Only page numbers and heading titles are kept here;
// the guide's text and any cards made from it stay out of this public repo (they are imported into your account).
// Split days: the guide has no topic for a section's intro video, so video k maps to topic k-1 in those sections.

export interface GuidePart {
  section: number;
  title: string;
  /** Video range from the 60-day plan, when the day covers part of a section. */
  videos?: [number, number];
  pages: [number, number];
  topics: string[];
}

export const GUIDE_TOTAL_PAGES = 477;

export const STUDY_GUIDE: Record<number, GuidePart[]> = {
  1: [{ section: 1, title: 'Introduction', pages: [1, 6], topics: ['Introduction', 'Exam Tips', 'Our Lab Environment'] }],
  2: [
    {
      section: 2,
      title: 'Network Fundamentals',
      pages: [7, 20],
      topics: [
        'Introduction',
        'Network Components',
        'Network Resources',
        'Network Geography',
        'Understanding Network Geography: Practical Example',
        'Wired Network Topology',
        'Wireless Network Topology',
        'Datacenter Topology',
      ],
    },
  ],
  3: [
    {
      section: 3,
      title: 'OSI Model (& TCP Model Ports/Protocol)',
      pages: [21, 42],
      topics: [
        'Introduction',
        'Layer 1 (Physical)',
        'Layer 2 (Data Link Layer)',
        'Layer 3 (Network Layer)',
        'Layer 4 (Transport Layer)',
        'Layer 5 (Session Layer)',
        'Layer 6 (Presentation Layer)',
        'Layer 7 (Application Layer)',
        'Encapsulation and Decapsulation',
        'Understanding the OSI Model: Practical Example',
      ],
    },
  ],
  4: [
    {
      section: 4,
      title: 'Ports and Protocols',
      pages: [43, 61],
      topics: [
        'Introduction',
        'Network Port Fundamentals',
        'Transmission Control Protocol (TCP)',
        'User Datagram Protocol (UDP)',
        'Internet Control Message Protocol (ICMP)',
        'Web Ports and Protocols',
        'Email Ports and Protocols',
        'File Transfer Ports and Protocols',
        'Remote Access Ports and Protocols',
        'Network Service Ports and Protocols',
        'Other Network Service Ports and Protocols',
      ],
    },
  ],
  5: [
    {
      section: 5,
      title: 'Media and Connectors',
      pages: [62, 74],
      topics: [
        'Copper Media',
        'Copper Network Connections',
        'Building a Copper Cable: Demonstration',
        'Fiber Media',
        'Fiber Network Connections',
        'Transceivers',
      ],
    },
  ],
  6: [
    {
      section: 6,
      title: 'Distribution Systems',
      pages: [75, 83],
      topics: [
        'Cable Distribution Systems',
        'Wiring a Network Demonstration',
        'Testing a Network Demonstration',
        'Power Distribution Systems',
        'Heating, Ventilation, and Air (HVAC) Systems',
        'Fire Suppression Systems',
      ],
    },
  ],
  7: [
    {
      section: 7,
      title: 'Wireless Networks',
      pages: [84, 102],
      topics: [
        'Wireless Network Types',
        'Wireless Antennas',
        'Understanding Antennas',
        'Wireless Frequencies',
        '802.11 Standards',
        'Wireless Security',
        'Understanding Wireless Security: Demonstration',
        'When Wireless Security Fails: Demonstration',
        'Captive Portals',
      ],
    },
  ],
  8: [
    {
      section: 8,
      title: 'Ethernet Switching',
      videos: [1, 7],
      pages: [103, 111],
      topics: [
        'Ethernet Fundamentals',
        'Network Devices',
        'Understanding Network Devices: Demonstration',
        'Virtual Local Area Network (VLAN)',
        'VLAN Configuration',
        'Understanding VLANs Demonstration',
      ],
    },
  ],
  9: [
    {
      section: 8,
      title: 'Ethernet Switching',
      videos: [8, 10],
      pages: [112, 118],
      topics: ['Spanning Tree Protocol (STP)', 'Network Access Control', 'Maximum Transmission Unit'],
    },
    {
      section: 9,
      title: 'IP Addressing',
      videos: [1, 4],
      pages: [119, 125],
      topics: ['Introduction', 'IPv4 Addressing', 'IPv4 Address Types', 'IPv4 Data Flows'],
    },
  ],
  10: [
    {
      section: 9,
      title: 'IP Addressing',
      videos: [5, 9],
      pages: [126, 137],
      topics: [
        'Assigning IPv4 Addresses',
        'Computer Mathematics',
        'Subnetting',
        'Subnetting Practice',
        'Subnetting by Hand: Demonstration',
      ],
    },
  ],
  11: [
    {
      section: 9,
      title: 'IP Addressing',
      videos: [10, 12],
      pages: [138, 144],
      topics: ['IPv6 Addressing', 'IPv6 Data Flows', 'IPv4 and IPv6 Compatibility Requirements'],
    },
  ],
  12: [
    {
      section: 10,
      title: 'Routing',
      pages: [145, 161],
      topics: [
        'Introduction',
        'Routing Fundamentals',
        'Routing Tables',
        'Routing Protocols',
        'Route Selection',
        'Address Translation',
        'Routing Redundancy Protocols',
        'Understanding Routing: Demonstration',
        'Multicast Routing',
        'Generic Routing Encapsulation',
      ],
    },
  ],
  13: [
    {
      section: 11,
      title: 'Network Services',
      pages: [162, 183],
      topics: [
        'Introduction',
        'Dynamic Host Configuration Protocol (DHCP)',
        'Understanding DHCP: Demonstration',
        'Stateless Address Autoconfiguration (SLAAC)',
        'Domain Name System (DNS)',
        'DNS Record Types',
        'Securing DNS',
        'Understanding DNS: Demonstration',
        'Network Time Protocol (NTP)',
        'Quality of Service (QoS)',
        'QoS Categorization',
        'QoS Mechanisms',
      ],
    },
  ],
  14: [
    {
      section: 12,
      title: 'Wide Area Networks (WANs)',
      pages: [184, 200],
      topics: [
        'Introduction',
        'Fiber Optic Connections',
        'Cable (DOCSIS) Connections',
        'Digital Subscriber Line (DSL) Connections',
        'Satellite Connections',
        'Cellular Connections',
        'Microwave Connections',
        'Leased Line Connections',
        'MPLS Connections',
        'Understanding WAN Connections: Demonstration',
      ],
    },
  ],
  15: [
    {
      section: 13,
      title: 'Cloud and the Datacenter',
      pages: [201, 224],
      topics: [
        'Cloud Computing',
        'Cloud Service Models',
        'Cloud Deployment Models',
        'Using Cloud Computing: Demonstration',
        'Cloud Connectivity',
        'Cloud Security',
        'Network Virtualization',
        'Software-Defined Network (SDN)',
        'Software-Defined Wide Area Network (SD-WAN)',
        'Virtual Extensible Local Area Network (VXLAN)',
        'SASE and SSE',
      ],
    },
  ],
  16: [
    {
      section: 14,
      title: 'Network Security Fundamentals',
      pages: [225, 241],
      topics: [
        'The CIA Triad',
        'Threats and Vulnerabilities',
        'Risk Management',
        'Audits and Compliance',
        'Device Hardening',
        'Understanding Device Hardening: Demonstration',
        'Physical Security',
        'Honeypots and Active Defense',
      ],
    },
  ],
  17: [
    {
      section: 15,
      title: 'Network Attacks',
      pages: [242, 259],
      topics: [
        'Dos and DDos Attacks',
        'MAC Flooding',
        'Address Resolution Protocol (ARP) Attacks',
        'VLAN Hopping',
        'Domain Name System (DNS) Attacks',
        'On-path Attack',
        'Rogue Device and Attacks',
        'Social Engineering Attacks',
        'Understanding Phishing Attacks: Demonstration',
        'Malware Attacks',
        'Understanding Malware Attacks: Demonstration',
      ],
    },
  ],
  18: [
    {
      section: 16,
      title: 'Logical Security',
      videos: [1, 6],
      pages: [260, 273],
      topics: [
        'Identity and Access Management (IAM)',
        'Multifactor Authentication (MFA)',
        'Authentication Methods',
        'Security Principles',
        'Encryption',
      ],
    },
  ],
  19: [
    {
      section: 16,
      title: 'Logical Security',
      videos: [7, 11],
      pages: [274, 284],
      topics: [
        'Internet Protocol Security (IPSec)',
        'Public Key Infrastructure (PKI)',
        'Digital Certificates',
        'Understanding Digital Certificates: Demonstration',
        'Key Management',
      ],
    },
  ],
  20: [
    {
      section: 17,
      title: 'Network Segmentation',
      videos: [1, 7],
      pages: [285, 295],
      topics: [
        'Firewalls',
        'Access Control List (ACL)',
        'Segmentation Zones',
        'Jumpbox',
        'Understanding Firewalls: Demonstration',
        'Content Filtering',
      ],
    },
  ],
  21: [
    {
      section: 17,
      title: 'Network Segmentation',
      videos: [8, 14],
      pages: [296, 310],
      topics: [
        'Internet of Things (IoT)',
        'SCADA and ICS',
        'Bring Your Own Device (BYOD)',
        'Zero-trust and Architecture',
        'Virtual Private Network (VPN)',
        'Using VPN Connections: Demonstration',
        'Remote Access Management',
      ],
    },
  ],
  22: [
    {
      section: 18,
      title: 'Networking Monitoring',
      videos: [1, 6],
      pages: [311, 319],
      topics: [
        'Intrusion Detection and Protection Systems (IDS/IPS)',
        'Simple Network Management Protocol (SNMP)',
        'Network Sensors',
        'Packet Captures',
        'Network Flow Data',
      ],
    },
  ],
  23: [
    {
      section: 18,
      title: 'Networking Monitoring',
      videos: [7, 11],
      pages: [320, 335],
      topics: [
        'Log Aggregation with Syslog',
        'Security Information and Event Management (SIEM)',
        'Understanding SIEMs: Demonstration',
        'Network Performance Metrics',
        'Interface Statistics',
      ],
    },
  ],
  24: [
    {
      section: 19,
      title: 'Orchestration and Automation',
      pages: [336, 353],
      topics: [
        'Introduction',
        'Infrastructure as Code (IaC)',
        'When to Automate and Orchestrate',
        'Benefits of Automation and Orchestration',
        'Playbooks',
        'Upgrades and Compliance',
        'Automating Network Inventories',
        'Integrations and APIs',
        'Source Control',
        'Using Source Control: Demonstration',
      ],
    },
  ],
  25: [
    {
      section: 20,
      title: 'Documentation and Processes',
      pages: [354, 370],
      topics: [
        'Introduction',
        'Common Documentation',
        'Asset Management',
        'IP Address Management (IPAM)',
        'Common Agreements',
        'Product Lifecycle',
        'Change Management',
        'Configuration Management',
        'Patch Management',
      ],
    },
  ],
  26: [
    {
      section: 21,
      title: 'Disaster Recovery',
      pages: [371, 381],
      topics: [
        'Introduction',
        'High Availability Approaches',
        'Designing Redundant Networks',
        'Disaster Recovery Metrics',
        'Redundant Site Considerations',
        'Training and Exercises',
      ],
    },
  ],
  27: [
    {
      section: 22,
      title: 'Troubleshooting Methodology',
      pages: [382, 392],
      topics: [
        'Step One',
        'Step Two',
        'Step Three',
        'Step Four and Step Five',
        'Step Six',
        'Step Seven',
        'Understanding the Troubleshooting Methodology: Demonstration',
      ],
    },
  ],
  28: [
    {
      section: 23,
      title: 'Troubleshooting Tools',
      videos: [1, 7],
      pages: [393, 405],
      topics: [
        'Hardware Tools',
        'Software Tools',
        'ipconfig, ifconfig, and ip',
        'ping and traceroute',
        'nslookup, dig, and hostname',
        'arp',
      ],
    },
  ],
  29: [
    {
      section: 23,
      title: 'Troubleshooting Tools',
      videos: [8, 13],
      pages: [406, 416],
      topics: [
        'netstat',
        'tcpdump',
        'nmap',
        'Basic Network Device Commands',
        'More Network Device Commands',
        'Discovery Protocols',
      ],
    },
  ],
  30: [
    {
      section: 24,
      title: 'Troubleshooting Physical Networks',
      pages: [417, 433],
      topics: [
        'Network Cable Limitations',
        'Cable Signal Issues',
        'Copper Cable Issues',
        'Fiber Cable Issues',
        'Ethernet Issues',
        'Interface Issues',
        'Power over Ethernet (PoE) Issues',
      ],
    },
  ],
  31: [
    {
      section: 25,
      title: 'Troubleshooting Wireless Issues',
      pages: [434, 447],
      topics: [
        'Introduction',
        'Wireless Coverage Issues',
        'Interference Issues',
        'Client Disassociation Issues',
        'Incorrect Wireless Configurations',
        'Captive Portal Issues',
        'Wireless Considerations in Troubleshooting',
      ],
    },
  ],
  32: [
    {
      section: 26,
      title: 'Troubleshooting Network Services',
      pages: [448, 462],
      topics: [
        'Duplicate Addresses',
        'DHCP Issues',
        'Routing Issues',
        'Switching and Routing Loops',
        'Firewall Issues',
        'IP Configuration Issues',
        'VLAN Issues',
        'DNS and NTP Issues',
      ],
    },
  ],
  33: [
    {
      section: 27,
      title: 'Troubleshooting Performance Issues',
      pages: [463, 474],
      topics: [
        'Collisions and Broadcast Storms',
        'VoIP Issues',
        'Packet Loss',
        'Network Performance Issues',
        'Other Performance Issues',
      ],
    },
    { section: 28, title: 'Conclusion', pages: [475, 477], topics: ['Conclusion'] },
  ],
};
