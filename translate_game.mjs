#!/usr/bin/env node
/**
 * Translate game engine content from Chinese to English.
 * Run from project root: node translate_game.mjs
 */
import fs from 'fs';
import https from 'https';

const API_URL = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/$/, '');
const API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!API_URL || !API_KEY) {
  console.error('Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

async function callLLM(prompt) {
  const body = JSON.stringify({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}/v1/chat/completions`);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.choices[0].message.content);
        } catch (e) {
          reject(new Error('Parse error: ' + data.slice(0, 200)));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const SYSTEM_CONTEXT = `
You are adapting a Chinese management simulation game into English.
Scenario: A US/European multinational corporation has acquired a local overseas subsidiary.
The player is the Integration Lead sent by HQ to drive institutional change within 60 resource units.
Goal: convert 12 key stakeholders to support the new governance model.

Translation rules:
- Keep the same game mechanics and logic — only translate/adapt text
- Replace Chinese corporate context with equivalent multinational context  
- Replace Chinese names with Western/international names appropriate to the role
- Keep all JSON/JS syntax exactly intact — only change string values
- Action types in prefs: '示范'→'demonstrate', '沟通'→'communicate', '赋能'→'enable', '制度'→'institutionalize'
- Status labels: 未动→Unaware, 意识觉醒→Aware, 初步理解→Interested, 主动参与→Committed, 已转化→Converted
- Faction: 总部→HQ, 当地→Local
- Keep tone professional and appropriate for EMBA business school context
`;

// ─── 1. Translate PEOPLE ─────────────────────────────────────────────────────
const peoplePrompt = SYSTEM_CONTEXT + `

Translate the following JavaScript PEOPLE object from Chinese to English.
Adapt names, roles, descriptions, and hidden goals to fit the multinational acquisition scenario.
Return ONLY the translated JavaScript object, starting with exactly \`const PEOPLE={\` and ending with \`};\`
Keep all JS object keys unchanged. For prefs keys use: 'demonstrate', 'communicate', 'enable', 'institutionalize'

const PEOPLE={
  ceo:{name:'总部CEO',role:'总部最高决策者',desc:'能提供公开背书，但非常看重速度与结果。',faction:'总部',score:18,status:0,x:40,y:60,ties:['pm','cfo'],hidden_ties:[],
    hidden_goal:'快速实现ROI，维持股价，避免重大失误',
    prefs:{'示范':0.25,'制度':0.20,'沟通':-0.15}},
  pm:{name:'你',role:'海外整合负责人',desc:'跨总部与当地组织协调推进，是整个变革的发起者。',score:100,status:4,x:200,y:120,ties:['ceo','region'],hidden_ties:[],
    hidden_goal:'在总部要求与当地合法性之间找到平衡',
    prefs:{}},
  cfo:{name:'总部CFO',role:'总部资源把关人',desc:'关心预算、KPI和整合效率。私下与当地有非正式的财务摸底渠道。',faction:'总部',score:12,status:0,x:60,y:140,ties:['ceo'],hidden_ties:['region'],
    hidden_goal:'控制成本，确保财务指标达成',
    prefs:{'制度':0.25,'示范':0.15,'沟通':-0.15}},
  region:{name:'当地区域总经理',role:'区域桥梁人物',desc:'连接总部与当地组织，直接管辖厂长和运营主管，平衡利益冲突。与总部CEO有一条鲜为人知的私下渠道——赢得他的支持，可以绕过正式汇报链影响顶层决策。',faction:'当地',score:16,status:0,x:320,y:80,ties:['pm','plant','ops'],hidden_ties:['ceo'],
    hidden_goal:'维持当地团队稳定，保护既得利益',
    prefs:{'沟通':0.25,'赋能':0.15,'制度':-0.25}},
  plant:{name:'当地厂长',role:'生产运营部主管',desc:'握有现场执行节奏和工人信任，是落地成败的关键。',faction:'当地',score:10,status:0,x:280,y:200,ties:['region','engineer','union'],hidden_ties:['region'],
    hidden_goal:'保护现场工艺和工人信任，避免生产中断',
    prefs:{'赋能':0.25,'示范':0.20,'制度':-0.20}},
  hr:{name:'当地HR总监',role:'人力行政部主管',desc:'管理人才、流程和组织稳定性。向运营主管汇报。',faction:'当地',score:14,status:0,x:360,y:280,ties:['ops'],hidden_ties:['engineer'],
    hidden_goal:'防止关键人才流失，维持组织稳定',
    prefs:{'沟通':0.25,'赋能':0.20,'制度':-0.20}},
  sales:{name:'当地销售主管',role:'销售客户部主管',desc:'掌握客户关系和市场前线信息，对整合方向持保留态度，担忧变革影响现有客户利益。',faction:'当地',score:8,status:0,x:320,y:280,ties:['ops','customer'],hidden_ties:['customer'],
    hidden_goal:'担忧整合后提成体系被重构，正在联络大客户施压管理层',
    prefs:{'沟通':0.20,'制度':-0.40}},
  ops:{name:'当地运营主管',role:'运营管理部主管',desc:'负责海外运营落地与流程协调，务实稳健，关注执行效率，愿意在清晰框架下推进变革。',faction:'当地',score:22,status:0,x:360,y:200,ties:['region','hr','sales'],hidden_ties:['cfo'],
    hidden_goal:'',
    prefs:{'示范':0.25,'赋能':0.15,'制度':-0.15}},
  engineer:{name:'当地生产工程师',role:'生产运营部下属',desc:'深耕生产工艺多年，与一线工人关系密切，是车间现场的重要技术骨干。',faction:'当地',score:12,status:0,x:280,y:280,ties:['plant','union'],hidden_ties:['gov'],
    hidden_goal:'保护自己的权力和职位，维持老团队利益',
    prefs:{'沟通':0.20,'赋能':0.25,'制度':-0.25}},
  union:{name:'当地工会主席',role:'生产运营部下属',desc:'代表基层工人利益，直接向厂长汇报，是管理层与一线员工之间的重要沟通渠道。',faction:'当地',score:12,status:0,x:320,y:320,ties:['plant','engineer'],hidden_ties:['gov'],
    hidden_goal:'防止裁员，保护薪酬和工作条件',
    prefs:{'赋能':0.15,'沟通':0.15,'制度':-0.30}},
  gov:{name:'当地骨干工人',role:'生产运营部下属',desc:'掌握一线工人的真实想法和情绪，是工人与管理层之间的重要桥梁。具有很强的群众基础和号召力。',faction:'当地',score:10,status:0,x:400,y:320,ties:['engineer'],hidden_ties:['union'],
    hidden_goal:'维护工人利益，确保工资和福利不下降，防止裁员',
    prefs:{'赋能':0.25,'沟通':0.20,'制度':-0.25}},
  customer:{name:'大客户销售',role:'销售客户部下属',desc:'代表大客户与本公司的关系，掌握客户需求和满意度。一旦认为整合影响服务质量，会向上级反映压力。',faction:'当地',score:12,status:0,x:380,y:200,ties:['sales','finance'],hidden_ties:['ceo'],
    hidden_goal:'维持客户满意度，确保订单稳定，保护销售团队的提成',
    prefs:{'示范':0.25,'沟通':0.15,'制度':-0.15}},
  finance:{name:'当地数据分析师',role:'销售客户部下属',desc:'掌握成本、风险和真实的财务故事，能改变决策方向。隐形影响力强。',faction:'当地',score:13,status:0,x:380,y:240,ties:['sales','customer'],hidden_ties:['cfo'],
    hidden_goal:'确保财务安全，跟随强势方',
    prefs:{'制度':0.20,'示范':0.15,'沟通':-0.10}}
};`;

// ─── 2. Translate ROLES and constants ─────────────────────────────────────────
const rolesPrompt = SYSTEM_CONTEXT + `
Translate the following JavaScript constants. Return ONLY the translated JS, no explanation, no markdown.

const STATUS_LABELS=['未动','意识觉醒','初步理解','主动参与','已转化'];

const ROLES = {
  integrator: {
    id:'integrator',
    name:'整合负责人',
    tag:'中方 · 总部派驻',
    briefing:'你是中国制造业集团的海外整合负责人。公司刚完成欧洲并购，希望在 60 个资源内推动新的治理和协同方式落地。',
    goal:'用完全部 60 个资源。转化人数越多、健康度越高，得分越高（满分 100）。',
    startCred:6,
    startPressure:0,
    pressureCap:10,
    colorAccent:'var(--primary)'
  }
};

const ACTION_GROUPS = [
  { key:'communicate', label:'💬 沟通', ids:['interview','email','progress','social-gathering'] },
  { key:'demonstrate', label:'🌱 示范', ids:['exemplify','success-story','pilot'] },
  { key:'enable',      label:'🎓 赋能', ids:['external-training','internal-training'] },
  { key:'institution', label:'🏛 制度', ids:['ceo-endorse','recognize','kpi','incentive'] }
];

const ACTION_TYPE_ALIASES = {
  '示范': 'Demonstrate',
  '沟通': 'Communicate',
  '赋能': 'Enable',
  '制度': 'Institutionalize',
  'demonstrate': 'Demonstrate',
  'communicate': 'Communicate',
  'enable': 'Enable',
  'institution': 'Institutionalize',
};

const PRESSURE_RELIEF_ACTION = {
  id: 'pressure-relief',
  label: '缓解组织压力',
  type: '沟通',
  desc: '当组织压力过高时，主动采取措施缓解紧张局势。',
  weeks: 3,
};`;

// ─── 3. Translate ACTION metadata ─────────────────────────────────────────────
const actionMetaPrompt = SYSTEM_CONTEXT + `
Translate the following action metadata from Chinese to English for the multinational change management scenario.
Return a JSON array. Keep id values unchanged. Translate label, desc, cooldownReason.
For type values use: demonstrate, communicate, enable, institutionalize
Return ONLY the JSON array, no markdown fences.

[
  {"id":"exemplify","label":"以身作则","type":"示范","desc":"先用行动建立可信度，再推动别人。变革早期信号最强，随着更多人转化后效果逐渐递减，但始终有助于维持可信度。若连续重复使用而中间没有其他动作，信号退化为"作秀"，效果打折并损失可信度。","cooldownReason":"这个动作建立的信任需要时间沉淀，过于频繁会显得虚伪。信任是组织变革的基础，不能急功近利。"},
  {"id":"ceo-endorse","label":"争取总部公开背书","type":"制度","desc":"通过公开支持提升你的正当性。首次背书信号最强；反复求背书会逐渐消耗与CEO的政治资本，边际效果递减。","cooldownReason":"总部的每次公开表态都会被组织内部反复解读。频繁的背书反而会削弱信号的可信度，让人觉得这是"作秀"而非真正的承诺。"},
  {"id":"interview","label":"私人访谈","type":"沟通","desc":"深度私人对话——一次访谈即可全面解锁对方的动作偏好与隐藏关系网络（另一种方式是邀请对方参加休闲聚会）。每次可访谈一至两人，但同时约谈两人时，每人获得的深度关注相对减少，推进效果略低于单独访谈。对同一人过度访谈会显得烦人，引发反感。有冷却期。","cooldownReason":"深度访谈需要充分的准备和消化时间。一次真正深入的对话比两次浅层交流更有价值，但需要更长的间隔来让信任自然沉淀。"},
  {"id":"email","label":"发布组织邮件","type":"沟通","desc":"广播工具，一次覆盖所有未转化的人，但说服深度随阶段递减——越是深度观望者，邮件越难打动。使用次数越多，收件人越容易产生"邮件疲劳"，多次使用后效果大幅下降。","cooldownReason":"邮件是低成本的广播工具，可以频繁使用。但过于频繁的邮件会导致"邮件疲劳"，人们开始忽视你的信息。"},
  {"id":"external-training","label":"外部培训","type":"赋能","desc":"引入外部和高校进行专业培训。变革早期新鲜感强，对未接触过变革的员工效果显著；后期员工已有先入为主，新鲜感递减。需选定若干参与者。","cooldownReason":"外部培训需要协调外部讲师和课程安排，准备周期较长。"},
  {"id":"internal-training","label":"内部培训","type":"赋能","desc":"内部师傅带领培训，帮助员工掌握实际操作技能。变革早期员工尚未做好准备，效果相对有限；后期对已有意愿者效果显著。需选定若干参与者。","cooldownReason":"培训需要精心设计和充分准备。频繁的培训会分散团队的注意力，也难以确保每次培训的质量。"},
  {"id":"pilot","label":"小范围试点","type":"示范","desc":"把抽象的变革要求变成可以看得见、摸得着的实际成果。最能说服那些"眼见为实"的人。","cooldownReason":"试点需要充分的时间来观察效果和收集反馈。过于频繁的试点会导致组织疲劳，也难以区分不同试点的真实效果。"},
  {"id":"success-story","label":"讲述成功案例","type":"示范","desc":"用真实案例激励目标，强化变革可行性的信念。没有任何转化成果时强行讲故事，听众会主动抵触。反复讲述同类案例会产生"故事疲劳"，多次使用后效果递减。不同人物对叙事的接受度差异明显。","cooldownReason":"成功案例是低成本的激励工具，可以频繁使用。每个新的成功都能强化变革的合法性。"},
  {"id":"progress","label":"发布阶段进展","type":"沟通","desc":"让观望者看到变革正在推进。成果越扎实，效果越好；成果不足时发布，实干派会反感，可信度也会受损。","cooldownReason":"进展报告需要足够素材（已转化的跟随者、实际落地的项目），频繁使用相同模板将引发「又来一篇水文」的质疑。"},
  {"id":"recognize","label":"公开认可示范者","type":"制度","desc":"公开表彰有实际成果的人，放大示范效应。目标必须已处于「参与」状态或以上；表彰火候未到的人会引发全组织质疑。","cooldownReason":"公开认可是一种稀缺的资源，过于频繁会贬低其价值。每次认可都应该是有分量的，才能真正激励他人。"},
  {"id":"kpi","label":"宣布KPI与时限","type":"制度","desc":"能制造紧迫感，但组织也会感到压力。若你的信誉尚未建立且缺乏真实成果，硬推KPI会被认为是"蛮干"而引发反弹。","cooldownReason":"指标和时限是强有力的管理工具，但频繁改变会导致组织混乱。每次宣布都需要足够的时间让组织消化和适应。"},
  {"id":"incentive","label":"调整激励与奖惩","type":"制度","desc":"通过制度改变推动全体。对尚未形成意愿的人，制度信号有限；对已有初步理解的人，制度推力最有效；对已参与者，可直接突破最后一跳。需要极高的政治资本才能推行，但代价是会明显提升组织压力。","cooldownReason":"激励制度的改变涉及复杂的人事和财务流程。频繁改变会导致员工困惑，也难以评估每次改变的真实效果。"},
  {"id":"social-gathering","label":"休闲聚会","type":"沟通","desc":"饭局、喝酒、轻松活动——在非正式场合建立信任，有冷却期。对已有初步理解的人效果显著；若参与者之间本就有正式关系，信任建立更自然，效果更好；若参与者之间存在已发现的隐藏关系，效果进一步增强；若参与者之间有尚未发现的隐藏关系，聚会后可能意外察觉到某种私下联系，但需要私人访谈才能真正激活其战略价值；有已转化同事参与时，口碑会自然扩散至其关系邻居。过度使用后效果打折，可信度受损。","cooldownReason":"聚会需要时间让关系自然沉淀。过于频繁的饭局会让人觉得你在刻意拉拢，反而产生戒备。"}
]`;

// ─── Run all translations ─────────────────────────────────────────────────────
console.log('Translating PEOPLE...');
const peopleResult = await callLLM(peoplePrompt);
fs.writeFileSync('/home/ubuntu/translated_people.js', peopleResult);
console.log('PEOPLE done.');

console.log('Translating ROLES/STATUS...');
const rolesResult = await callLLM(rolesPrompt);
fs.writeFileSync('/home/ubuntu/translated_roles.js', rolesResult);
console.log('ROLES done.');

console.log('Translating ACTION metadata...');
const actionsResult = await callLLM(actionMetaPrompt);
fs.writeFileSync('/home/ubuntu/translated_actions_meta.json', actionsResult);
console.log('ACTIONS done.');

console.log('\nAll translations complete!');
