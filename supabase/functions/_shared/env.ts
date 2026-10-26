// Lecture des variables d'environnement, compatible Deno (Edge Functions) et Node (tests)
export function readEnv(name: string): string | undefined {
  const g = globalThis as any;
  const value = g.Deno?.env?.get(name) ?? g.process?.env?.[name];
  return typeof value === 'string' ? value : undefined;
}
