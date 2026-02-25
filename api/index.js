import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://SEU-PROJETO.supabase.co", "SERVICE-ROLE-KEY");

let boss = { x: 100, y: 100, hp: 100 };
let minions = [
  { x: 120, y: 100 },
  { x: 80, y: 100 }
];

export default async function handler(req, res) {
  // Atualiza o boss e envia broadcast
  boss.x += Math.random() > 0.5 ? 1 : -1;
  boss.y += Math.random() > 0.5 ? 1 : -1;
  minions.forEach(m => {
    m.x += Math.random() > 0.5 ? 1 : -1;
    m.y += Math.random() > 0.5 ? 1 : -1;
  });

  await supabase.channel("boss").send({
    type: "broadcast",
    event: "state",
    payload: { boss, minions }
  });

  res.status(200).json({ ok: true, boss, minions });
}
