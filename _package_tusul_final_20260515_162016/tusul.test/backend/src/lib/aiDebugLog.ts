export function isAiDebugEnabled(): boolean {
  return process.env.AI_DEBUG === 'true' || process.env.NODE_ENV !== 'production';
}

export function logAiResponse(provider: string, label: string, payload: unknown): void {
  if (!isAiDebugEnabled()) return;
  const divider = '='.repeat(60);
  console.log(`\n${divider}\n[AI ${provider}] ${label}\n${divider}`);
  if (typeof payload === 'string') {
    console.log(payload);
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }
  console.log(`${divider}\n`);
}
