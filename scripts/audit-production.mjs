import { spawnSync } from 'node:child_process';

const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmExecutable, ['audit', '--omit=dev', '--json'], { encoding: 'utf8' });
const report = JSON.parse(result.stdout || '{}');
const acceptedAdvisories = new Set([
  'GHSA-6gpp-xcg3-4w24',
  'GHSA-m99w-x7hq-7vfj',
  'GHSA-89xv-2m56-2m9x',
  'GHSA-68g3-v927-f742',
  'GHSA-4633-3j49-mh5q',
  'GHSA-4c39-4ccg-62r3',
  'GHSA-p9j2-gv94-2wf4',
  'GHSA-q8wf-6r8g-63ch',
  'GHSA-955p-x3mx-jcvp',
  'GHSA-qx2v-qp2m-jg93',
  'GHSA-6g55-p6wh-862q',
  'GHSA-r28c-9q8g-f849',
  'GHSA-f88m-g3jw-g9cj',
]);

const unresolved = Object.values(report.vulnerabilities ?? {}).filter((vulnerability) => {
  if (vulnerability.severity !== 'high' && vulnerability.severity !== 'critical') return false;
  return vulnerability.via.some((source) => {
    if (typeof source === 'string') return source !== 'postcss' && source !== 'sharp';
    return !acceptedAdvisories.has(source.url?.split('/').pop());
  });
});

if (unresolved.length) {
  console.error(
    'Dependências de produção com vulnerabilidades não aceitas:',
    unresolved.map((item) => item.name).join(', '),
  );
  process.exit(1);
}

const accepted = Object.values(report.vulnerabilities ?? {}).filter(
  (item) => item.severity === 'high' || item.severity === 'critical',
);
if (accepted.length)
  console.warn(
    `Avisos upstream aceitos temporariamente: ${accepted.map((item) => item.name).join(', ')}. Veja README.md.`,
  );
else console.log('Nenhuma vulnerabilidade alta ou crítica de produção encontrada.');
