import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clean up existing data
  await prisma.comment.deleteMany();
  await prisma.workflowApproval.deleteMany();
  await prisma.talentPoolMember.deleteMany();
  await prisma.talentPool.deleteMany();
  await prisma.successor.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.retirementProfile.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.user.deleteMany();
  await prisma.orgUnit.deleteMany();

  console.log('Creating org structure...');

  // ---- ORG UNITS ----
  const company = await prisma.orgUnit.create({ data: { name: 'GlobalCorp', type: 'COMPANY' } });

  const naRegion = await prisma.orgUnit.create({ data: { name: 'North America Region', type: 'REGION', parentId: company.id } });
  const europeRegion = await prisma.orgUnit.create({ data: { name: 'Europe Region', type: 'REGION', parentId: company.id } });
  const headOffice = await prisma.orgUnit.create({ data: { name: 'Head Office', type: 'REGION', parentId: company.id } });

  const salesDiv = await prisma.orgUnit.create({ data: { name: 'Sales Division', type: 'DIVISION', parentId: naRegion.id } });
  const opsDiv = await prisma.orgUnit.create({ data: { name: 'Operations Division', type: 'DIVISION', parentId: naRegion.id } });
  const mktDiv = await prisma.orgUnit.create({ data: { name: 'Marketing Division', type: 'DIVISION', parentId: europeRegion.id } });
  const finDiv = await prisma.orgUnit.create({ data: { name: 'Finance Division', type: 'DIVISION', parentId: headOffice.id } });
  const hrDiv = await prisma.orgUnit.create({ data: { name: 'HR Division', type: 'DIVISION', parentId: headOffice.id } });
  const techDiv = await prisma.orgUnit.create({ data: { name: 'Technology Division', type: 'DIVISION', parentId: headOffice.id } });

  const salesDept = await prisma.orgUnit.create({ data: { name: 'Sales Department', type: 'DEPARTMENT', parentId: salesDiv.id } });
  const enterpriseTeam = await prisma.orgUnit.create({ data: { name: 'Enterprise Sales Team', type: 'TEAM', parentId: salesDept.id } });
  const opsDept = await prisma.orgUnit.create({ data: { name: 'Operations Department', type: 'DEPARTMENT', parentId: opsDiv.id } });
  const mktDept = await prisma.orgUnit.create({ data: { name: 'Marketing Department', type: 'DEPARTMENT', parentId: mktDiv.id } });
  const finDept = await prisma.orgUnit.create({ data: { name: 'Finance Department', type: 'DEPARTMENT', parentId: finDiv.id } });
  const hrDept = await prisma.orgUnit.create({ data: { name: 'HR Department', type: 'DEPARTMENT', parentId: hrDiv.id } });
  const engDept = await prisma.orgUnit.create({ data: { name: 'Engineering Department', type: 'DEPARTMENT', parentId: techDiv.id } });

  console.log('Creating users...');

  // ---- USERS ----
  const adminPwd = await bcrypt.hash('Admin@123', 10);
  const pwd = await bcrypt.hash('Password@123', 10);

  const adminUser = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@company.com', passwordHash: adminPwd, role: 'ADMIN', orgUnitId: headOffice.id },
  });
  const sarahHR = await prisma.user.create({
    data: { name: 'Sarah Johnson', email: 'sarah.hr@company.com', passwordHash: pwd, role: 'HR', orgUnitId: hrDept.id },
  });
  const jamesMgr = await prisma.user.create({
    data: { name: 'James Miller', email: 'james.manager@company.com', passwordHash: pwd, role: 'MANAGER', orgUnitId: salesDept.id },
  });
  const execUser = await prisma.user.create({
    data: { name: 'Executive Viewer', email: 'exec@company.com', passwordHash: pwd, role: 'EXECUTIVE_VIEWER', orgUnitId: headOffice.id },
  });

  console.log('Creating positions...');

  // ---- POSITIONS ----
  const ctoPosn = await prisma.position.create({
    data: {
      jobTitle: 'Chief Technology Officer',
      orgUnitId: techDiv.id,
      location: 'New York, USA',
      isCritical: true,
      criticalityLevel: 'HIGH',
      description: 'Leads the technology strategy and engineering organization.',
      competencies: ['Strategic Leadership', 'Technology Vision', 'Team Building', 'Innovation'],
      skills: ['Cloud Architecture', 'Agile', 'Digital Transformation'],
    },
  });

  const vpSalesPosn = await prisma.position.create({
    data: {
      jobTitle: 'VP of Sales',
      orgUnitId: salesDiv.id,
      location: 'Chicago, USA',
      isCritical: true,
      criticalityLevel: 'HIGH',
      description: 'Oversees all sales operations and revenue generation in North America.',
      competencies: ['Sales Leadership', 'Revenue Growth', 'Account Management', 'Team Development'],
      skills: ['CRM', 'B2B Sales', 'Sales Forecasting'],
    },
  });

  const headFinancePosn = await prisma.position.create({
    data: {
      jobTitle: 'Head of Finance',
      orgUnitId: finDept.id,
      location: 'New York, USA',
      isCritical: true,
      criticalityLevel: 'HIGH',
      description: 'Leads all financial operations, reporting and compliance.',
      competencies: ['Financial Management', 'Risk Assessment', 'Regulatory Compliance'],
      skills: ['Financial Reporting', 'ERP Systems', 'Budget Management'],
    },
  });

  const cfoPosn = await prisma.position.create({
    data: {
      jobTitle: 'Chief Financial Officer',
      orgUnitId: finDiv.id,
      location: 'New York, USA',
      isCritical: true,
      criticalityLevel: 'HIGH',
      description: 'Responsible for all financial strategy and investor relations.',
      competencies: ['Executive Leadership', 'Financial Strategy', 'M&A'],
      skills: ['GAAP', 'Financial Modeling', 'Capital Markets'],
    },
  });

  const salesDirEMEA = await prisma.position.create({
    data: {
      jobTitle: 'Sales Director EMEA',
      orgUnitId: mktDept.id,
      location: 'London, UK',
      isCritical: true,
      criticalityLevel: 'HIGH',
      description: 'Leads sales and business development across Europe, Middle East, and Africa.',
      competencies: ['Regional Leadership', 'Market Expansion', 'Enterprise Sales'],
      skills: ['B2B Sales', 'EMEA Markets', 'Multilingual Communication'],
    },
  });

  const hrDirPosn = await prisma.position.create({
    data: {
      jobTitle: 'HR Director',
      orgUnitId: hrDept.id,
      location: 'New York, USA',
      isCritical: true,
      criticalityLevel: 'MEDIUM',
      description: 'Leads all HR functions including talent management and organizational development.',
      competencies: ['HR Strategy', 'Change Management', 'Employee Relations'],
      skills: ['HRIS', 'Talent Acquisition', 'Learning & Development'],
    },
  });

  const opsMgrPosn = await prisma.position.create({
    data: {
      jobTitle: 'Operations Manager',
      orgUnitId: opsDept.id,
      location: 'Dallas, USA',
      isCritical: false,
      criticalityLevel: 'MEDIUM',
      description: 'Manages day-to-day operations and process improvements.',
      competencies: ['Operations Management', 'Process Improvement', 'Team Leadership'],
      skills: ['Six Sigma', 'Supply Chain', 'KPI Management'],
    },
  });

  const mktDirPosn = await prisma.position.create({
    data: {
      jobTitle: 'Marketing Director',
      orgUnitId: mktDept.id,
      location: 'Paris, France',
      isCritical: true,
      criticalityLevel: 'HIGH',
      description: 'Leads all marketing strategy and brand development for Europe.',
      competencies: ['Brand Management', 'Digital Marketing', 'Campaign Strategy'],
      skills: ['SEO/SEM', 'Marketing Analytics', 'Content Strategy'],
    },
  });

  const dataArchPosn = await prisma.position.create({
    data: {
      jobTitle: 'Data Architect',
      orgUnitId: engDept.id,
      location: 'San Francisco, USA',
      isCritical: true,
      criticalityLevel: 'HIGH',
      description: 'Designs and maintains the enterprise data architecture.',
      competencies: ['Data Modeling', 'Architecture Design', 'Data Governance'],
      skills: ['SQL', 'Data Warehousing', 'Cloud Platforms', 'ETL'],
    },
  });

  const srSWEPosn = await prisma.position.create({
    data: {
      jobTitle: 'Senior Software Engineer',
      orgUnitId: engDept.id,
      location: 'San Francisco, USA',
      isCritical: false,
      criticalityLevel: 'MEDIUM',
      description: 'Leads technical delivery of key engineering projects.',
      competencies: ['Software Design', 'Technical Leadership', 'Code Review'],
      skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
    },
  });

  const accountingMgrPosn = await prisma.position.create({
    data: {
      jobTitle: 'Accounting Manager',
      orgUnitId: finDept.id,
      location: 'New York, USA',
      isCritical: false,
      criticalityLevel: 'MEDIUM',
      description: 'Manages the accounting team and financial close processes.',
      competencies: ['Accounting', 'Team Management', 'Financial Close'],
      skills: ['SAP', 'Financial Reporting', 'Tax Compliance'],
    },
  });

  const salesMgrPosn = await prisma.position.create({
    data: {
      jobTitle: 'Enterprise Sales Manager',
      orgUnitId: enterpriseTeam.id,
      location: 'Chicago, USA',
      isCritical: false,
      criticalityLevel: 'LOW',
      description: 'Manages the enterprise sales team and quota achievement.',
      competencies: ['Sales Management', 'Coaching', 'Deal Structuring'],
      skills: ['Salesforce', 'Pipeline Management', 'Negotiation'],
    },
  });

  const devOpsPosn = await prisma.position.create({
    data: {
      jobTitle: 'DevOps Lead',
      orgUnitId: engDept.id,
      location: 'San Francisco, USA',
      isCritical: false,
      criticalityLevel: 'MEDIUM',
      description: 'Leads infrastructure automation and CI/CD pipelines.',
      competencies: ['Infrastructure', 'Automation', 'Security'],
      skills: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS'],
    },
  });

  const hrBPPosn = await prisma.position.create({
    data: {
      jobTitle: 'HR Business Partner',
      orgUnitId: hrDept.id,
      location: 'Chicago, USA',
      isCritical: false,
      criticalityLevel: 'LOW',
      description: 'Partners with business units to align HR practices.',
      competencies: ['Stakeholder Management', 'HR Advisory', 'Conflict Resolution'],
      skills: ['Workday', 'Employee Relations', 'Performance Management'],
    },
  });

  const mktAnalystPosn = await prisma.position.create({
    data: {
      jobTitle: 'Marketing Analytics Manager',
      orgUnitId: mktDept.id,
      location: 'London, UK',
      isCritical: false,
      criticalityLevel: 'LOW',
      description: 'Leads data-driven marketing decisions and campaign analytics.',
      competencies: ['Data Analysis', 'Marketing Intelligence', 'Reporting'],
      skills: ['Google Analytics', 'Tableau', 'SQL', 'Excel'],
    },
  });

  console.log('Creating employees...');

  // ---- EMPLOYEES ----
  const emp1 = await prisma.employee.create({
    data: { name: 'Alexandra Chen', email: 'a.chen@company.com', jobTitle: 'Senior Director Engineering', orgUnitId: engDept.id, location: 'San Francisco, USA', yearsOfService: 12 },
  });
  const emp2 = await prisma.employee.create({
    data: { name: 'Michael Torres', email: 'm.torres@company.com', jobTitle: 'Principal Architect', orgUnitId: engDept.id, location: 'San Francisco, USA', yearsOfService: 9 },
  });
  const emp3 = await prisma.employee.create({
    data: { name: 'Jennifer Walsh', email: 'j.walsh@company.com', jobTitle: 'VP Finance', orgUnitId: finDept.id, location: 'New York, USA', yearsOfService: 18 },
  });
  const emp4 = await prisma.employee.create({
    data: { name: 'Robert Kim', email: 'r.kim@company.com', jobTitle: 'Finance Director', orgUnitId: finDept.id, location: 'New York, USA', yearsOfService: 14 },
  });
  const emp5 = await prisma.employee.create({
    data: { name: 'Priya Sharma', email: 'p.sharma@company.com', jobTitle: 'Sales VP', orgUnitId: salesDept.id, location: 'Chicago, USA', yearsOfService: 11 },
  });
  const emp6 = await prisma.employee.create({
    data: { name: 'David Laurent', email: 'd.laurent@company.com', jobTitle: 'Regional Sales Director', orgUnitId: salesDept.id, location: 'Chicago, USA', yearsOfService: 7 },
  });
  const emp7 = await prisma.employee.create({
    data: { name: 'Sophie Dubois', email: 's.dubois@company.com', jobTitle: 'Marketing Manager', orgUnitId: mktDept.id, location: 'Paris, France', yearsOfService: 6 },
  });
  const emp8 = await prisma.employee.create({
    data: { name: 'Carlos Rodriguez', email: 'c.rodriguez@company.com', jobTitle: 'Senior Software Engineer', orgUnitId: engDept.id, location: 'San Francisco, USA', yearsOfService: 5 },
  });
  const emp9 = await prisma.employee.create({
    data: { name: 'Lisa Thompson', email: 'l.thompson@company.com', jobTitle: 'HR Manager', orgUnitId: hrDept.id, location: 'New York, USA', yearsOfService: 8 },
  });
  const emp10 = await prisma.employee.create({
    data: { name: 'James Bennett', email: 'j.bennett@company.com', jobTitle: 'Operations Director', orgUnitId: opsDept.id, location: 'Dallas, USA', yearsOfService: 16 },
  });
  const emp11 = await prisma.employee.create({
    data: { name: 'Natalie Park', email: 'n.park@company.com', jobTitle: 'Data Engineer', orgUnitId: engDept.id, location: 'San Francisco, USA', yearsOfService: 4 },
  });
  const emp12 = await prisma.employee.create({
    data: { name: 'Thomas Hughes', email: 't.hughes@company.com', jobTitle: 'Finance Analyst', orgUnitId: finDept.id, location: 'New York, USA', yearsOfService: 3 },
  });
  const emp13 = await prisma.employee.create({
    data: { name: 'Elena Vasquez', email: 'e.vasquez@company.com', jobTitle: 'Enterprise Account Executive', orgUnitId: enterpriseTeam.id, location: 'Chicago, USA', yearsOfService: 5 },
  });
  const emp14 = await prisma.employee.create({
    data: { name: 'William Foster', email: 'w.foster@company.com', jobTitle: 'Chief Strategy Officer', orgUnitId: headOffice.id, location: 'New York, USA', yearsOfService: 22 },
  });
  const emp15 = await prisma.employee.create({
    data: { name: 'Mei Lin', email: 'm.lin@company.com', jobTitle: 'DevOps Engineer', orgUnitId: engDept.id, location: 'San Francisco, USA', yearsOfService: 4 },
  });
  const emp16 = await prisma.employee.create({
    data: { name: 'Brendan O\'Sullivan', email: 'b.osullivan@company.com', jobTitle: 'EMEA Sales Manager', orgUnitId: mktDept.id, location: 'London, UK', yearsOfService: 9 },
  });
  const emp17 = await prisma.employee.create({
    data: { name: 'Amara Osei', email: 'a.osei@company.com', jobTitle: 'HR Business Partner', orgUnitId: hrDept.id, location: 'New York, USA', yearsOfService: 6 },
  });
  const emp18 = await prisma.employee.create({
    data: { name: 'Nathan Clarke', email: 'n.clarke@company.com', jobTitle: 'Marketing Analyst', orgUnitId: mktDept.id, location: 'London, UK', yearsOfService: 3 },
  });
  const emp19 = await prisma.employee.create({
    data: { name: 'Grace Hoffman', email: 'g.hoffman@company.com', jobTitle: 'Product Manager', orgUnitId: engDept.id, location: 'San Francisco, USA', yearsOfService: 7 },
  });
  const emp20 = await prisma.employee.create({
    data: { name: 'Victor Petrov', email: 'v.petrov@company.com', jobTitle: 'Senior Data Scientist', orgUnitId: engDept.id, location: 'San Francisco, USA', yearsOfService: 5 },
  });
  const emp21 = await prisma.employee.create({
    data: { name: 'Diane Morrison', email: 'd.morrison@company.com', jobTitle: 'CFO', orgUnitId: finDiv.id, location: 'New York, USA', yearsOfService: 25 },
  });
  const emp22 = await prisma.employee.create({
    data: { name: 'Alan Nakamura', email: 'a.nakamura@company.com', jobTitle: 'CTO', orgUnitId: techDiv.id, location: 'New York, USA', yearsOfService: 20 },
  });

  console.log('Creating retirement profiles...');

  // ---- RETIREMENT PROFILES ----
  await prisma.retirementProfile.create({ data: { employeeId: emp14.id, yearsToRetirement: 1, category: 'IMMEDIATE' } });
  await prisma.retirementProfile.create({ data: { employeeId: emp21.id, yearsToRetirement: 2, category: 'IMMEDIATE' } });
  await prisma.retirementProfile.create({ data: { employeeId: emp10.id, yearsToRetirement: 4, category: 'MID_TERM' } });
  await prisma.retirementProfile.create({ data: { employeeId: emp3.id, yearsToRetirement: 3, category: 'MID_TERM' } });
  await prisma.retirementProfile.create({ data: { employeeId: emp22.id, yearsToRetirement: 7, category: 'LONG_TERM' } });
  await prisma.retirementProfile.create({ data: { employeeId: emp4.id, yearsToRetirement: 8, category: 'LONG_TERM' } });

  console.log('Creating risk assessments...');

  // ---- RISK ASSESSMENTS ----
  await prisma.riskAssessment.create({ data: { positionId: ctoPosn.id, employeeId: emp22.id, riskLevel: 'HIGH', flightRiskScore: 8, engagementScore: 6, marketDemand: 'Very High', notes: 'Key person risk, limited internal pipeline.' } });
  await prisma.riskAssessment.create({ data: { positionId: vpSalesPosn.id, employeeId: emp5.id, riskLevel: 'HIGH', flightRiskScore: 7, engagementScore: 7, marketDemand: 'High', notes: 'Competitor offers reported.' } });
  await prisma.riskAssessment.create({ data: { positionId: headFinancePosn.id, employeeId: emp3.id, riskLevel: 'MEDIUM', flightRiskScore: 4, engagementScore: 8, marketDemand: 'Medium', notes: 'Near retirement, transition planning needed.' } });
  await prisma.riskAssessment.create({ data: { positionId: cfoPosn.id, employeeId: emp21.id, riskLevel: 'HIGH', flightRiskScore: 9, engagementScore: 5, marketDemand: 'Very High', notes: 'Imminent retirement. Critical succession gap.' } });
  await prisma.riskAssessment.create({ data: { positionId: salesDirEMEA.id, employeeId: emp16.id, riskLevel: 'MEDIUM', flightRiskScore: 5, engagementScore: 7, marketDemand: 'High', notes: 'Growing candidate.' } });
  await prisma.riskAssessment.create({ data: { positionId: hrDirPosn.id, employeeId: emp9.id, riskLevel: 'LOW', flightRiskScore: 2, engagementScore: 9, marketDemand: 'Medium', notes: 'Highly engaged, succession plan in progress.' } });
  await prisma.riskAssessment.create({ data: { positionId: mktDirPosn.id, employeeId: emp7.id, riskLevel: 'HIGH', flightRiskScore: 7, engagementScore: 6, marketDemand: 'High', notes: 'Recent competitor approaches reported.' } });
  await prisma.riskAssessment.create({ data: { positionId: dataArchPosn.id, employeeId: emp2.id, riskLevel: 'MEDIUM', flightRiskScore: 6, engagementScore: 7, marketDemand: 'Very High', notes: 'Specialised role, limited successors identified.' } });
  await prisma.riskAssessment.create({ data: { positionId: opsMgrPosn.id, employeeId: emp10.id, riskLevel: 'MEDIUM', flightRiskScore: 3, engagementScore: 8, marketDemand: 'Low', notes: 'Mid-term retirement.' } });
  await prisma.riskAssessment.create({ data: { positionId: srSWEPosn.id, employeeId: emp8.id, riskLevel: 'LOW', flightRiskScore: 3, engagementScore: 8, marketDemand: 'High', notes: 'Strong performer, growing quickly.' } });

  console.log('Creating successors...');

  // ---- SUCCESSORS ----
  // CTO Successors
  const s1 = await prisma.successor.create({
    data: {
      employeeId: emp1.id, positionId: ctoPosn.id,
      isPrimary: true, readinessLevel: 'READY_1_2_YEARS',
      performanceRating: 5, potentialRating: 5,
      strengths: 'Deep technical expertise, proven track record in leading large engineering teams, strong business acumen.',
      developmentAreas: 'Board-level communication, enterprise-wide strategic planning.',
      leadershipPotential: 'High - demonstrated executive presence and strong cross-functional influence.',
      mobility: true, status: 'FINALIZED',
    },
  });
  const s2 = await prisma.successor.create({
    data: {
      employeeId: emp2.id, positionId: ctoPosn.id,
      isPrimary: false, readinessLevel: 'READY_3_5_YEARS',
      performanceRating: 4, potentialRating: 4,
      strengths: 'Excellent architecture skills, innovative problem solver.',
      developmentAreas: 'People management at scale, P&L ownership.',
      leadershipPotential: 'Medium-High - strong individual contributor currently transitioning to leader.',
      mobility: false, status: 'REVIEW',
    },
  });

  // VP Sales Successors
  const s3 = await prisma.successor.create({
    data: {
      employeeId: emp5.id, positionId: vpSalesPosn.id,
      isPrimary: true, readinessLevel: 'READY_NOW',
      performanceRating: 5, potentialRating: 5,
      strengths: 'Outstanding revenue track record, excellent client relationships, natural leader.',
      developmentAreas: 'Cross-functional collaboration, long-term strategic planning.',
      leadershipPotential: 'Very High - ready for step-up immediately.',
      mobility: true, status: 'FINALIZED',
    },
  });
  const s4 = await prisma.successor.create({
    data: {
      employeeId: emp6.id, positionId: vpSalesPosn.id,
      isPrimary: false, readinessLevel: 'READY_1_2_YEARS',
      performanceRating: 4, potentialRating: 4,
      strengths: 'Strong pipeline management, coach and mentor to junior reps.',
      developmentAreas: 'Executive stakeholder management, global market experience.',
      leadershipPotential: 'High.',
      mobility: false, status: 'REVIEW',
    },
  });

  // Head of Finance Successors
  const s5 = await prisma.successor.create({
    data: {
      employeeId: emp4.id, positionId: headFinancePosn.id,
      isPrimary: true, readinessLevel: 'READY_1_2_YEARS',
      performanceRating: 4, potentialRating: 4,
      strengths: 'Deep finance expertise, regulatory knowledge, calm under pressure.',
      developmentAreas: 'Executive communication, digital finance transformation.',
      leadershipPotential: 'High.',
      mobility: true, status: 'APPROVAL',
    },
  });

  // CFO Successors
  const s6 = await prisma.successor.create({
    data: {
      employeeId: emp3.id, positionId: cfoPosn.id,
      isPrimary: true, readinessLevel: 'READY_NOW',
      performanceRating: 5, potentialRating: 4,
      strengths: 'Complete mastery of financial operations, investor relations experience.',
      developmentAreas: 'Technology-driven finance strategies.',
      leadershipPotential: 'Very High.',
      mobility: false, status: 'FINALIZED',
    },
  });

  // Sales Director EMEA
  const s7 = await prisma.successor.create({
    data: {
      employeeId: emp16.id, positionId: salesDirEMEA.id,
      isPrimary: true, readinessLevel: 'READY_1_2_YEARS',
      performanceRating: 4, potentialRating: 5,
      strengths: 'Strong EMEA market knowledge, language skills, expanding regional network.',
      developmentAreas: 'P&L management, strategic account planning.',
      leadershipPotential: 'High.',
      mobility: true, status: 'REVIEW',
    },
  });

  // HR Director
  const s8 = await prisma.successor.create({
    data: {
      employeeId: emp9.id, positionId: hrDirPosn.id,
      isPrimary: true, readinessLevel: 'READY_1_2_YEARS',
      performanceRating: 4, potentialRating: 4,
      strengths: 'Strong employee relations, talent management expertise.',
      developmentAreas: 'Strategic workforce planning, HR technology.',
      leadershipPotential: 'High.',
      mobility: false, status: 'DRAFT',
    },
  });
  const s8b = await prisma.successor.create({
    data: {
      employeeId: emp17.id, positionId: hrDirPosn.id,
      isPrimary: false, readinessLevel: 'READY_3_5_YEARS',
      performanceRating: 3, potentialRating: 4,
      strengths: 'Excellent stakeholder management, growing HR capabilities.',
      developmentAreas: 'Team leadership, broader business exposure.',
      leadershipPotential: 'Medium-High.',
      mobility: true, status: 'DRAFT',
    },
  });

  // Marketing Director
  const s9 = await prisma.successor.create({
    data: {
      employeeId: emp7.id, positionId: mktDirPosn.id,
      isPrimary: true, readinessLevel: 'READY_NOW',
      performanceRating: 5, potentialRating: 5,
      strengths: 'Brand strategy, digital marketing, proven campaign ROI.',
      developmentAreas: 'Global brand management, executive stakeholder engagement.',
      leadershipPotential: 'Very High.',
      mobility: true, status: 'FINALIZED',
    },
  });

  // Data Architect
  const s10 = await prisma.successor.create({
    data: {
      employeeId: emp11.id, positionId: dataArchPosn.id,
      isPrimary: false, readinessLevel: 'READY_3_5_YEARS',
      performanceRating: 4, potentialRating: 4,
      strengths: 'Strong data engineering fundamentals, cloud-native experience.',
      developmentAreas: 'Enterprise architecture, governance frameworks.',
      leadershipPotential: 'Medium.',
      mobility: false, status: 'DRAFT',
    },
  });

  const s11 = await prisma.successor.create({
    data: {
      employeeId: emp20.id, positionId: dataArchPosn.id,
      isPrimary: false, readinessLevel: 'READY_1_2_YEARS',
      performanceRating: 4, potentialRating: 5,
      strengths: 'Advanced analytics, ML pipeline expertise.',
      developmentAreas: 'Data governance, cross-team mentoring.',
      leadershipPotential: 'High.',
      mobility: true, status: 'REVIEW',
    },
  });

  console.log('Creating talent pools...');

  // ---- TALENT POOLS ----
  const executivePool = await prisma.talentPool.create({
    data: {
      name: 'Executive Leadership Pipeline',
      poolType: 'LEADERSHIP_TRACK',
      description: 'High-potential employees identified for future executive leadership roles within 3-5 years.',
    },
  });
  const technicalPool = await prisma.talentPool.create({
    data: {
      name: 'Technical Excellence Pool',
      poolType: 'SKILL_GROUP',
      description: 'Senior engineers and architects with specialized technical skills critical to innovation.',
    },
  });
  const salesPool = await prisma.talentPool.create({
    data: {
      name: 'Sales High Performers',
      poolType: 'ROLE_TYPE',
      description: 'Top sales performers with demonstrated ability to lead and scale revenue teams.',
    },
  });

  // Executive Pool members
  await prisma.talentPoolMember.create({ data: { talentPoolId: executivePool.id, employeeId: emp1.id, developmentPlan: 'Executive coaching, board exposure, P&L ownership rotation', trainingProgress: 75 } });
  await prisma.talentPoolMember.create({ data: { talentPoolId: executivePool.id, employeeId: emp5.id, developmentPlan: 'Executive MBA sponsorship, cross-functional leadership project', trainingProgress: 85 } });
  await prisma.talentPoolMember.create({ data: { talentPoolId: executivePool.id, employeeId: emp4.id, developmentPlan: 'CFO mentoring program, M&A exposure', trainingProgress: 60 } });
  await prisma.talentPoolMember.create({ data: { talentPoolId: executivePool.id, employeeId: emp9.id, developmentPlan: 'Strategic HR leadership certification, board advisory exposure', trainingProgress: 50 } });

  // Technical Pool members
  await prisma.talentPoolMember.create({ data: { talentPoolId: technicalPool.id, employeeId: emp2.id, developmentPlan: 'AWS Solutions Architect Professional, enterprise architecture training', trainingProgress: 80 } });
  await prisma.talentPoolMember.create({ data: { talentPoolId: technicalPool.id, employeeId: emp8.id, developmentPlan: 'Tech lead program, architecture design workshops', trainingProgress: 65 } });
  await prisma.talentPoolMember.create({ data: { talentPoolId: technicalPool.id, employeeId: emp11.id, developmentPlan: 'Data governance certification, cloud data platform training', trainingProgress: 55 } });
  await prisma.talentPoolMember.create({ data: { talentPoolId: technicalPool.id, employeeId: emp20.id, developmentPlan: 'Machine learning leadership, data architecture mentoring', trainingProgress: 70 } });
  await prisma.talentPoolMember.create({ data: { talentPoolId: technicalPool.id, employeeId: emp15.id, developmentPlan: 'Kubernetes certification, platform engineering leadership', trainingProgress: 45 } });

  // Sales Pool members
  await prisma.talentPoolMember.create({ data: { talentPoolId: salesPool.id, employeeId: emp6.id, developmentPlan: 'VP Sales readiness program, executive sales training', trainingProgress: 70 } });
  await prisma.talentPoolMember.create({ data: { talentPoolId: salesPool.id, employeeId: emp13.id, developmentPlan: 'Enterprise sales management certification', trainingProgress: 40 } });
  await prisma.talentPoolMember.create({ data: { talentPoolId: salesPool.id, employeeId: emp16.id, developmentPlan: 'EMEA regional leadership program, P&L management training', trainingProgress: 60 } });

  console.log('Creating comments...');

  // ---- COMMENTS ----
  await prisma.comment.create({ data: { successorId: s1.id, authorId: sarahHR.id, content: 'Alexandra has shown exceptional leadership in Q4. Recommend accelerating to READY_NOW status at next review cycle.', version: 1 } });
  await prisma.comment.create({ data: { successorId: s1.id, authorId: adminUser.id, content: 'Agreed. She has been leading the digital transformation initiative single-handedly. Strong candidate.', version: 1 } });
  await prisma.comment.create({ data: { successorId: s3.id, authorId: jamesMgr.id, content: 'Priya closed $50M in Q3 alone. She has the gravitas and vision to lead the entire sales organization.', version: 1 } });
  await prisma.comment.create({ data: { successorId: s6.id, authorId: sarahHR.id, content: 'Jennifer is fully prepared. Transition plan drafted and CFO mentoring initiated.', version: 1 } });
  await prisma.comment.create({ data: { successorId: s7.id, authorId: adminUser.id, content: 'Brendan is making excellent progress in EMEA. Recommend formal nomination at Q2 review.', version: 1 } });

  console.log('Creating workflows...');

  // ---- WORKFLOWS ----
  await prisma.workflowApproval.create({ data: { entityType: 'Successor', entityId: s1.id, positionId: ctoPosn.id, status: 'FINALIZED', approverId: adminUser.id, notes: 'Approved at board level Q1 2026.' } });
  await prisma.workflowApproval.create({ data: { entityType: 'Successor', entityId: s3.id, positionId: vpSalesPosn.id, status: 'FINALIZED', approverId: adminUser.id, notes: 'Succession plan ratified by CHRO.' } });
  await prisma.workflowApproval.create({ data: { entityType: 'Successor', entityId: s5.id, positionId: headFinancePosn.id, status: 'APPROVAL', approverId: sarahHR.id, notes: 'Awaiting CFO sign-off.' } });
  await prisma.workflowApproval.create({ data: { entityType: 'Successor', entityId: s7.id, positionId: salesDirEMEA.id, status: 'REVIEW', approverId: jamesMgr.id, notes: 'Under review by regional VP.' } });
  await prisma.workflowApproval.create({ data: { entityType: 'Successor', entityId: s8.id, positionId: hrDirPosn.id, status: 'DRAFT', approverId: sarahHR.id, notes: 'Initial nomination submitted.' } });
  await prisma.workflowApproval.create({ data: { entityType: 'Successor', entityId: s9.id, positionId: mktDirPosn.id, status: 'FINALIZED', approverId: adminUser.id, notes: 'Finalized and approved.' } });
  await prisma.workflowApproval.create({ data: { entityType: 'Successor', entityId: s6.id, positionId: cfoPosn.id, status: 'FINALIZED', approverId: adminUser.id, notes: 'CFO succession plan approved by board.' } });
  await prisma.workflowApproval.create({ data: { entityType: 'Successor', entityId: s11.id, positionId: dataArchPosn.id, status: 'REVIEW', approverId: sarahHR.id, notes: 'Under technical review.' } });

  console.log('Seed complete!');
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
