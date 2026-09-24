// Source: CompTIA Network+ N10-009 Exam Objectives (official, v4.0).
// Not part of the Study Plan PDF. Titles are the official wording.

export type Domain = 1 | 2 | 3 | 4 | 5;

export interface Objective {
  id: string;
  domain: Domain;
  title: string;
}

export const DOMAINS: Record<Domain, { name: string; weight: number }> = {
  1: { name: 'Networking Concepts', weight: 23 },
  2: { name: 'Network Implementation', weight: 20 },
  3: { name: 'Network Operations', weight: 19 },
  4: { name: 'Network Security', weight: 14 },
  5: { name: 'Network Troubleshooting', weight: 24 },
};

export const OBJECTIVES: Objective[] = [
  { id: '1.1', domain: 1, title: 'Explain concepts related to the Open Systems Interconnection (OSI) reference model' },
  { id: '1.2', domain: 1, title: 'Compare and contrast networking appliances, applications, and functions' },
  { id: '1.3', domain: 1, title: 'Summarize cloud concepts and connectivity options' },
  { id: '1.4', domain: 1, title: 'Explain common networking ports, protocols, services, and traffic types' },
  { id: '1.5', domain: 1, title: 'Compare and contrast transmission media and transceivers' },
  { id: '1.6', domain: 1, title: 'Compare and contrast network topologies, architectures, and types' },
  { id: '1.7', domain: 1, title: 'Given a scenario, use appropriate IPv4 network addressing' },
  { id: '1.8', domain: 1, title: 'Summarize evolving use cases for modern network environments' },
  { id: '2.1', domain: 2, title: 'Explain characteristics of routing technologies' },
  { id: '2.2', domain: 2, title: 'Given a scenario, configure switching technologies and features' },
  { id: '2.3', domain: 2, title: 'Given a scenario, select and configure wireless devices and technologies' },
  { id: '2.4', domain: 2, title: 'Explain important factors of physical installations' },
  { id: '3.1', domain: 3, title: 'Explain the purpose of organizational processes and procedures' },
  { id: '3.2', domain: 3, title: 'Given a scenario, use network monitoring technologies' },
  { id: '3.3', domain: 3, title: 'Explain disaster recovery (DR) concepts' },
  { id: '3.4', domain: 3, title: 'Given a scenario, implement IPv4 and IPv6 network services' },
  { id: '3.5', domain: 3, title: 'Compare and contrast network access and management methods' },
  { id: '4.1', domain: 4, title: 'Explain the importance of basic network security concepts' },
  { id: '4.2', domain: 4, title: 'Summarize various types of attacks and their impact to the network' },
  { id: '4.3', domain: 4, title: 'Given a scenario, apply network security features, defense techniques, and solutions' },
  { id: '5.1', domain: 5, title: 'Explain the troubleshooting methodology' },
  { id: '5.2', domain: 5, title: 'Given a scenario, troubleshoot common cabling and physical interface issues' },
  { id: '5.3', domain: 5, title: 'Given a scenario, troubleshoot common issues with network services' },
  { id: '5.4', domain: 5, title: 'Given a scenario, troubleshoot common performance issues' },
  { id: '5.5', domain: 5, title: 'Given a scenario, use the appropriate tool or protocol to solve networking issues' },
];

export const OBJECTIVE_BY_ID: Record<string, Objective> = Object.fromEntries(OBJECTIVES.map((o) => [o.id, o]));

/** Short label for tight UI (first clause after "Given a scenario,"). */
export function shortTitle(o: Objective): string {
  return o.title.replace(/^Given a scenario, /, '').replace(/^\w/, (c) => c.toUpperCase());
}
