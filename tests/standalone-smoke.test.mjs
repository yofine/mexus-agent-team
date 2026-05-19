import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { startMission } from '../scripts/start-mission.mjs'
import { teamStatus } from '../scripts/status.mjs'

const pluginRoot = path.resolve(new URL('..', import.meta.url).pathname)

const SKILLS = ['mission', 'continue', 'roundtable', 'board', 'status']

for (const file of [
  '.codex-plugin/plugin.json',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  'README.md',
  'skills/mission/SKILL.md',
  'skills/continue/SKILL.md',
  'skills/roundtable/SKILL.md',
  'skills/board/SKILL.md',
  'skills/status/SKILL.md',
  'skills/board/board-app/package.json',
  'references/mission-workflow.md',
  'references/agent-roster-template.md',
  'references/mission-template.md',
  'references/agents-template.md',
  'references/kanban-template.md',
  'references/roundtable-template.md',
  'references/squad-lead-template.md',
  'scripts/start-mission.mjs',
  'scripts/status.mjs',
  'scripts/start-board.mjs',
]) {
  assert.ok(fs.existsSync(path.join(pluginRoot, file)), `${file} should exist`)
}

// team-stop and its script were removed; nobody stops the board explicitly.
assert.ok(!fs.existsSync(path.join(pluginRoot, 'skills/team-stop')), 'team-stop skill should be removed')
assert.ok(!fs.existsSync(path.join(pluginRoot, 'scripts/stop-board.mjs')), 'stop-board.mjs should be removed')

for (const skill of SKILLS) {
  const body = fs.readFileSync(path.join(pluginRoot, 'skills', skill, 'SKILL.md'), 'utf8')
  assert.match(body, /^---\n[\s\S]+?\n---\n/, `${skill} should have frontmatter`)
  assert.match(body, /description: .+/, `${skill} should have description`)
}

// mission only creates; continue only resumes. The two must not overlap.
const missionSkill = fs.readFileSync(path.join(pluginRoot, 'skills/mission/SKILL.md'), 'utf8')
assert.match(missionSkill, /only creates a new Mission/i)
assert.match(missionSkill, /start-board\.mjs/, 'mission should start the board')
const continueSkill = fs.readFileSync(path.join(pluginRoot, 'skills/continue/SKILL.md'), 'utf8')
assert.match(continueSkill, /only continues an existing active Mission/i)
assert.match(continueSkill, /does not .*archive/i, 'continue must state it does not archive Missions')

const boardSkill = fs.readFileSync(path.join(pluginRoot, 'skills/board/SKILL.md'), 'utf8')
assert.match(boardSkill, /--host 0\.0\.0\.0/)
assert.match(boardSkill, /--public-host/)

const startBoardScript = fs.readFileSync(path.join(pluginRoot, 'scripts/start-board.mjs'), 'utf8')
assert.match(startBoardScript, /host: '0\.0\.0\.0'/)
assert.match(startBoardScript, /--public-host/)
assert.match(startBoardScript, /processAlive/, 'start-board should check whether a board process is still alive')

const claudePlugin = JSON.parse(fs.readFileSync(path.join(pluginRoot, '.claude-plugin/plugin.json'), 'utf8'))
assert.equal(claudePlugin.name, 'mexus-team')

const codexPlugin = JSON.parse(fs.readFileSync(path.join(pluginRoot, '.codex-plugin/plugin.json'), 'utf8'))
assert.equal(codexPlugin.name, 'mexus-team')

const marketplace = JSON.parse(fs.readFileSync(path.join(pluginRoot, '.claude-plugin/marketplace.json'), 'utf8'))
assert.equal(marketplace.name, 'mexus-team')
assert.ok(Array.isArray(marketplace.plugins), 'marketplace plugins should be an array')
assert.ok(
  marketplace.plugins.some((plugin) => plugin.name === 'mexus-team' && plugin.source === './'),
  'marketplace should include a bundle entry at ./',
)
for (const skill of SKILLS) {
  assert.ok(
    marketplace.plugins.some(
      (plugin) => plugin.name === `mexus-team-${skill}` && plugin.source === `./skills/${skill}`,
    ),
    `marketplace should include per-skill entry for ${skill}`,
  )
}

const readme = fs.readFileSync(path.join(pluginRoot, 'README.md'), 'utf8')
assert.match(readme, /\/mexus-team:mission/)
assert.match(readme, /\/mexus-team:continue/)
assert.match(readme, /\/mexus-team:roundtable/)
assert.doesNotMatch(readme, /mexus-skill/)
assert.doesNotMatch(readme, /^\/team/m)

const forbiddenRuntimeTerms = [
  'mexus pane create',
  'mexus mission activate',
  'MissionInboxPipeline',
  'external A2A',
]
for (const rel of ['README.md', 'skills/mission/SKILL.md']) {
  const body = fs.readFileSync(path.join(pluginRoot, rel), 'utf8')
  for (const term of forbiddenRuntimeTerms) {
    if (term === 'external A2A') {
      assert.match(body, /no external A2A|without external A2A|Do not use external A2A/i, `${rel} should explicitly reject external A2A`)
    } else {
      assert.ok(!body.includes(term), `${rel} should not depend on ${term}`)
    }
  }
  assert.match(body, /does not require.*Mission Inbox|no .*Mission Inbox|without .*Mission Inbox|must not .*Mission Inbox/i, `${rel} should reject Mission Inbox dependency`)
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mexus-agent-team-standalone-'))
const created = startMission([
  '--root',
  temp,
  '--name',
  'demo-mission',
  '--request',
  'Build a demo feature with background Agents',
])

assert.equal(created.mission, 'demo-mission')
assert.deepEqual(created.archived, [])

for (const file of [
  'agent-team/mission-workflow.md',
  'agent-team/agents.md',
  'agent-team/missions/demo-mission/mission.md',
  'agent-team/missions/demo-mission/agents.md',
  'agent-team/missions/demo-mission/kanban.md',
  'agent-team/missions/demo-mission/roundtable.md',
  'agent-team/missions/demo-mission/squad-lead.md',
]) {
  assert.ok(fs.existsSync(path.join(temp, file)), `${file} should be generated`)
}

const mission = fs.readFileSync(path.join(temp, 'agent-team/missions/demo-mission/mission.md'), 'utf8')
assert.match(mission, /Execution mode: background-agents/)
assert.match(mission, /Do not require a Mexus server/)
assert.match(mission, /external A2A/)
assert.match(mission, /Each executing background Agent/)

// The seed Agent name is drawn at random from the Ars Goetia set.
const ARS_GOETIA = [
  'Bael', 'Agares', 'Vassago', 'Samigina', 'Marbas', 'Valefor', 'Amon', 'Barbatos',
  'Paimon', 'Buer', 'Gusion', 'Sitri', 'Beleth', 'Leraje', 'Eligos', 'Zepar',
  'Botis', 'Bathin', 'Sallos', 'Purson', 'Marax', 'Ipos', 'Aim', 'Naberius',
  'Glasya', 'Bune', 'Ronove', 'Berith', 'Astaroth', 'Forneus', 'Foras', 'Asmoday',
  'Gaap', 'Furfur', 'Marchosias', 'Stolas', 'Phenex', 'Halphas', 'Malphas', 'Raum',
  'Focalor', 'Vepar', 'Sabnock', 'Shax', 'Vine', 'Bifrons', 'Vual', 'Haagenti',
  'Crocell', 'Furcas', 'Balam', 'Alloces', 'Caim', 'Murmur', 'Orobas', 'Gremory',
  'Ose', 'Amy', 'Orias', 'Vapula', 'Zagan', 'Valac', 'Andras', 'Flauros',
  'Andrealphus', 'Kimaris', 'Amdusias', 'Belial', 'Decarabia', 'Seere', 'Dantalion', 'Andromalius',
]

const agents = fs.readFileSync(path.join(temp, 'agent-team/missions/demo-mission/agents.md'), 'utf8')
assert.match(agents, /Squad Lead: Squad Lead/)
assert.match(agents, /background Agent/)
assert.match(agents, /Modules:/)
assert.match(agents, /kanban\.md is the communication channel/)
const seedName = agents.match(/^## Agent: (\S+)\s*$/m)?.[1]
assert.ok(seedName && ARS_GOETIA.includes(seedName), `seed Agent name should be an Ars Goetia name, got: ${seedName}`)

const status = teamStatus(['--root', temp, '--name', 'demo-mission'])
assert.match(status, /Mission: demo-mission/)
assert.match(status, /Tasks: 1 to claim \/ 0 in progress \/ 0 done/)

const kanban = fs.readFileSync(path.join(temp, 'agent-team/missions/demo-mission/kanban.md'), 'utf8')
assert.match(kanban, new RegExp(`To: ${seedName} \\| From: Squad Lead`))
assert.doesNotMatch(kanban, /From: User|Updated: .*User/)
assert.doesNotMatch(kanban, /To: Squad Lead/)

const second = startMission([
  '--root',
  temp,
  '--name',
  'second-mission',
  '--request',
  'Build a second demo feature',
])
assert.equal(second.mission, 'second-mission')
assert.deepEqual(second.archived, ['demo-mission'])

const archivedMission = fs.readFileSync(path.join(temp, 'agent-team/missions/demo-mission/mission.md'), 'utf8')
const activeMission = fs.readFileSync(path.join(temp, 'agent-team/missions/second-mission/mission.md'), 'utf8')
assert.match(archivedMission, /Lifecycle: archived/)
assert.match(activeMission, /Lifecycle: active/)

console.log('mexus-agent-team standalone smoke passed')
