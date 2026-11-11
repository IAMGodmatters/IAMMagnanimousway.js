export function calculate(source) {
  const s = String(source || '').replace(/\s+/g, '');
  if (!s || !/^[\d.+\-*/%()]+$/.test(s)) throw new Error('Enter a valid arithmetic expression.');
  const tokens = s.match(/\d+(?:\.\d+)?|[()+\-*/%]/g) || [];
  if (tokens.join('') !== s) throw new Error('Check the expression and try again.');
  let i = 0;
  const primary = () => {
    const token = tokens[i++];
    if (token === '(') {
      const value = expression();
      if (tokens[i++] !== ')') throw new Error('A closing parenthesis is missing.');
      return value;
    }
    if (token === undefined || !/^\d+(?:\.\d+)?$/.test(token)) throw new Error('A number is missing.');
    return Number(token);
  };
  const unary = () => {
    if (tokens[i] === '+') { i++; return unary(); }
    if (tokens[i] === '-') { i++; return -unary(); }
    return primary();
  };
  const term = () => {
    let value = unary();
    while (['*', '/', '%'].includes(tokens[i])) {
      const op = tokens[i++], right = unary();
      if ((op === '/' || op === '%') && right === 0) throw new Error('Division by zero is not allowed.');
      value = op === '*' ? value * right : op === '/' ? value / right : value % right;
    }
    return value;
  };
  const expression = () => {
    let value = term();
    while (tokens[i] === '+' || tokens[i] === '-') {
      const op = tokens[i++], right = term();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  };
  const result = expression();
  if (i !== tokens.length || !Number.isFinite(result)) throw new Error('The expression could not be calculated.');
  return Number(result.toPrecision(12));
}

const UNITS = {
  Length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, ft: 0.3048, in: 0.0254, mi: 1609.344 },
  Weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523125 },
  Volume: { L: 1, mL: 0.001, gal: 3.785411784, cup: 0.2365882365 },
};
export function convert(value, category, from, to) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) throw new Error('Enter a valid number.');
  if (category === 'Temperature') {
    const celsius = from === '°C' ? amount : from === '°F' ? (amount - 32) * 5 / 9 : amount - 273.15;
    return to === '°C' ? celsius : to === '°F' ? celsius * 9 / 5 + 32 : celsius + 273.15;
  }
  const units = UNITS[category];
  if (!units || !(from in units) || !(to in units)) throw new Error('Choose valid units.');
  return amount * units[from] / units[to];
}

export function normalizeBackup(backup) {
  if (Array.isArray(backup?.records)) {
    if (backup.records.length > 500) throw new Error('A backup can contain no more than 500 records.');
    return backup.records.map((item, index) => {
      const kind = item?.data?.kind;
      if (!['task', 'note', 'planner', 'habit'].includes(kind)) throw new Error('The backup contains an unsupported record type.');
      const title = String(item.title || '').trim(), body = String(item.data?.body || '');
      if (!title || title.length > 240) throw new Error('Every imported item needs a title of 1–240 characters.');
      if (body.length > 12000) throw new Error('An imported note or description is too long.');
      const sourceId = String(item.id || item.sourceId || 'record-' + index).slice(0, 160);
      return {
        sourceId, kind, title,
        status: ['open', 'done', 'archived'].includes(item.status) ? item.status : 'open',
        due_at: Number.isFinite(item.due_at) ? item.due_at : null,
        data: { ...item.data, kind, body, backup_source_id: sourceId },
      };
    });
  }
  const data = backup?.workspace || backup;
  if (!data || !['tasks', 'notes', 'plans', 'habits'].every((key) => Array.isArray(data[key]))) {
    throw new Error('This is not a supported Magnanimous Studio backup.');
  }
  const records = [];
  const add = (kind, item, index, due_at = null) => {
    const title = String(item?.title || item?.name || (kind === 'note' ? 'Untitled note' : '')).trim();
    const body = String(item?.body || '');
    if (!title || title.length > 240) throw new Error('Every imported item needs a title of 1–240 characters.');
    if (body.length > 12000) throw new Error('An imported note or description is too long.');
    const sourceId = String(item?.id || kind + '-' + index).slice(0, 160);
    records.push({
      sourceId, kind, title, status: kind === 'task' && item.done ? 'done' : 'open', due_at,
      data: {
        kind, body,
        ...(kind === 'habit' ? { doneOn: String(item.doneOn || '') } : {}),
        ...(kind === 'planner' ? { legacy_date: String(item.date || ''), legacy_time: String(item.time || '') } : {}),
        backup_source_id: sourceId,
      },
    });
  };
  data.tasks.forEach((item, index) => add('task', item, index));
  data.notes.forEach((item, index) => add('note', item, index));
  data.plans.forEach((item, index) => {
    const local = item?.date && item?.time ? new Date(String(item.date) + 'T' + String(item.time)) : null;
    add('planner', item, index, local && Number.isFinite(local.getTime()) ? Math.floor(local.getTime() / 1000) : null);
  });
  data.habits.forEach((item, index) => add('habit', item, index));
  if (records.length > 500) throw new Error('A backup can contain no more than 500 records.');
  return records;
}
