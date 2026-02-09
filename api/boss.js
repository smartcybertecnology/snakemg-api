import { WebSocketServer } from "ws";

let boss = { x: 100, y: 100, hp: 100 };
let minions = [
  { x: 120, y: 100 },
  { x: 80, y: 100 }
];

export default function handler(req, res) {
  if (!global.wss) {
    global.wss = new WebSocketServer({ noServer: true });

    // Atualização periódica do boss
    setInterval(() => {
      boss.x += Math.random() > 0.5 ? 1 : -1;
      boss.y += Math.random() > 0.5 ? 1 : -1;
      minions.forEach(m => {
        m.x += Math.random() > 0.5 ? 1 : -1;
        m.y += Math.random() > 0.5 ? 1 : -1;
      });

      const state = { boss, minions };
      global.wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(state));
        }
      });
    }, 200);
  }

  res.status(200).send("Boss server running");
}
