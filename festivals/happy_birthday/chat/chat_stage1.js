// ── 第一阶段：AI 理想对话（固定，自动播放）──────────────────────────
// side: "left"=小魏, "right"=小余  delay: 距上一条消息毫秒间隔
var CHAT_MESSAGES = [
  { side: "left",  text: "嘿，你在吗？",                             delay: 600  },
  { side: "right", text: "呼噜呼噜",                           delay: 1200 },
  { side: "left",  text: "今天是个特别的日子，你知道吗 :)",           delay: 1400 },
  { side: "right", text: "咕噜咕噜",                       delay: 1000 },
  { side: "left",  text: "我整理了一些聊天图片",                   delay: 1600 },
  { side: "left",  text: "每一张都是有趣的回忆",                 delay: 900  },
  { side: "right", text: "咕咕嘎嘎？",   delay: 1800 },
  { side: "left",  text: "对！消失的不是照片，是我把它们放进心里了", delay: 2000 },
  { side: "right", text: "嗯呐嗯呐！",                     delay: 1400 },
  { side: "left",  text: "哈哈哈",                                   delay: 800  },
  { side: "left",  text: "祝小余生日快乐 ️❤️🎂",                              delay: 1200 },
];
