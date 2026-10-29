import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = fileURLToPath(new URL('../../', import.meta.url))
const normalize = value => value.replaceAll('\\', '/')
function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(absolute) : /\.(ts|tsx)$/.test(entry.name) ? [absolute] : []
  })
}
function imports(source) {
  const result = []
  const ast = ts.createSourceFile('source.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) result.push(node.moduleSpecifier.text)
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require')) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) result.push(node.arguments[0].text)
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return result
}
function violations(file, spec) {
  const relative = spec.startsWith('.')
  const target = relative ? normalize(path.posix.normalize(path.posix.join(path.posix.dirname(file), spec))) : spec
  const owner = file.match(/^(frontend|backend)\/src\/modules\/([^/]+)/)
  const other = target.match(/^(frontend|backend)\/src\/modules\/([^/]+)\/(.+)/)
  const errors = []
  if (file.startsWith('packages/contracts/') && !relative) errors.push('contracts must be framework-free')
  if (relative && !target.startsWith(file.split('/')[0] + '/')) errors.push('use the contracts package, not cross-project source imports')
  if (file.includes('/shared/') && /\/(modules|app)\//.test(target)) errors.push('shared cannot depend on application modules')
  if (owner && target.startsWith(`${owner[1]}/src/app`)) errors.push('modules cannot import app composition')
  if (other && (!owner || owner[2] !== other[2])) {
    const entry = other[3].replace(/\.(js|ts|tsx)$/, '')
    if (!['public', 'demo', 'detail'].includes(entry)) errors.push('cross-module imports must use public entry points')
    if (owner && ['demo', 'detail'].includes(entry)) errors.push('demo/detail entries are composition-only')
  }
  if (file.includes('/domain/') || file.includes('/application/')) {
    if (!relative && !spec.startsWith('@vitafarma/contracts/')) errors.push('domain/application cannot depend on frameworks or drivers')
    if (/\/(infrastructure|presentation|platform|shared)\//.test(target)) errors.push('dependency points out of the core')
    if (file.includes('/domain/') && target.includes('/application/')) errors.push('domain cannot depend on application')
  }
  return errors.map(error => `${file}: ${spec}: ${error}`)
}

test('source imports respect module boundaries and dependency direction', () => {
  const errors = []
  for (const directory of ['frontend/src', 'backend/src', 'packages/contracts/src']) {
    for (const absolute of sourceFiles(path.join(root, directory))) {
      const file = normalize(path.relative(root, absolute))
      for (const spec of imports(readFileSync(absolute, 'utf8'))) errors.push(...violations(file, spec))
    }
  }
  assert.deepEqual(errors, [])
})

test('module dependency graph has no cycles', () => {
  const graph = new Map()
  for (const project of ['backend', 'frontend']) {
    for (const absolute of sourceFiles(path.join(root, project, 'src/modules'))) {
      const file = normalize(path.relative(root, absolute))
      const owner = `${project}/${file.split('/')[3]}`
      if (!graph.has(owner)) graph.set(owner, new Set())
      for (const spec of imports(readFileSync(absolute, 'utf8')).filter(value => value.startsWith('.'))) {
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), spec)).match(/^(frontend|backend)\/src\/modules\/([^/]+)/)
        if (target && `${target[1]}/${target[2]}` !== owner) graph.get(owner).add(`${target[1]}/${target[2]}`)
      }
    }
  }
  function walk(node, stack = []) {
    assert.equal(stack.includes(node), false, `Module cycle: ${[...stack, node].join(' -> ')}`)
    for (const dependency of graph.get(node) ?? []) walk(dependency, [...stack, node])
  }
  for (const node of graph.keys()) walk(node)
})

test('boundary checks reject representative forbidden dependencies, including lazy imports', () => {
  assert.ok(violations('backend/src/modules/sales/application/sale.ts', '../../inventory/infrastructure/stock.js').length)
  assert.ok(violations('frontend/src/shared/ui/Button.tsx', '../../modules/inventory/public').length)
  assert.ok(violations('backend/src/modules/inventory/domain/stock.ts', '@nestjs/common').length)
  assert.ok(violations('packages/contracts/src/inventory.ts', '@nestjs/common').length)
  assert.deepEqual(imports("export { x } from './public'; const detail = import('./detail');"), ['./public', './detail'])
})
