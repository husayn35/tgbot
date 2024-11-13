const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const token = "7532206901:AAHWyP1N2AFwSufGvy2iKa69MfSnI7vwk94";
const bot = new TelegramBot(token, { polling: true });
const channelUsername = "@habibullayev28"; // Telegram kanalining username
const adminUsername = "@habibullayev_28"; // Adminning username'i

let users = []; // Foydalanuvchilar ro'yxati
let adminChatId = null; // Adminning chat ID

// Foydalanuvchilarni fayldan yuklash
function loadUsers() {
  try {
    const data = fs.readFileSync("users.json");
    users = JSON.parse(data);
  } catch (error) {
    console.log("Foydalanuvchilarni yuklashda xato:", error);
  }
}

// Foydalanuvchilarni faylga saqlash
function saveUsers() {
  try {
    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
  } catch (error) {
    console.log("Foydalanuvchilarni saqlashda xato:", error);
  }
}

// Foydalanuvchining malumotlarini olish uchun funksiya
function getUserInfo(msg) {
  const chatId = msg.chat.id;
  const username = msg.from.username; // Foydalanuvchining username'i
  const firstName = msg.from.first_name; // Foydalanuvchining ismi
  const lastName = msg.from.last_name; // Foydalanuvchining familiyasi
  return { chatId, username, firstName, lastName };
}

// Foydalanuvchining kanalga obuna bo'lganligini tekshirish
function checkSubscription(chatId) {
  return bot
    .getChatMember(channelUsername, chatId)
    .then((member) => {
      return (
        member.status === "member" ||
        member.status === "administrator" ||
        member.status === "creator"
      );
    })
    .catch((error) => {
      console.error("Obuna tekshiruvda xato:", error);
      return false; // Agar xato bo'lsa, foydalanuvchini obuna bo'lmagan deb hisoblang
    });
}

// Botga kirgan foydalanuvchidan har qanday xabarni olish
bot.on("message", (msg) => {
  const { chatId, username, firstName } = getUserInfo(msg); // Foydalanuvchi malumotlarini olish

  // Agar admin bilan bog'lanish uchun adminni topish
  if (adminChatId === null && username === adminUsername) {
    // Adminning chat ID sini saqlaymiz
    adminChatId = chatId;
    bot.sendMessage(chatId, "Admin bo'lib tizimga kirdingiz.");
  }

  // Foydalanuvchi kanalga obuna bo'lganini tekshirish
  checkSubscription(chatId).then((isSubscribed) => {
    if (!isSubscribed) {
      // Foydalanuvchi kanalga obuna bo'lmagan bo'lsa, xabar yuborish
      bot.sendMessage(
        chatId,
        `${firstName}, Botni ishlatish uchun ${channelUsername} kanaliga obuna bo'ling.`
      );
    } else {
      // Yangi foydalanuvchini qo'shish
      if (!users.find((user) => user.chatId === chatId)) {
        users.push({ chatId, username, firstName });

        // Yangi foydalanuvchi qo'shilganida adminga xabar yuborish
        if (adminChatId) {
          const newUserMessage = `${firstName} (@${username}) kanalga obuna bo'ldi va botni ishga tushirdi.`;
          bot.sendMessage(adminChatId, newUserMessage);
        }

        // Yangi foydalanuvchilar ro'yxatini saqlash
        saveUsers();
      }

      if (msg.text === "/start") {
        bot.sendMessage(
          chatId,
          "Iltimos quyidagi tugmalardan birini tanlang 👇",
          {
            reply_markup: {
              keyboard: [
                ["Loyihalar 🖇"], // Birinchi qatorda bitta tugma
                ["Biz haqimizda"],
              ],
              resize_keyboard: true, // Tugmalarni ekranga mos ravishda kichraytirish
              one_time_keyboard: false, // Tugmalar bir marta bosilgandan keyin yo‘qolmaydi
            },
          }
        );
      }

      // "Loyihalar 🖇" tugmasi bosilganda javob berish
      if (msg.text === "Loyihalar 🖇") {
        bot.sendMessage(chatId, "zt-ai.netlify.app");
      }
      if (msg.text === "Biz haqimizda") {
        bot.sendMessage(
          chatId,
          "Instagram: instagram.com/28_kh_ \nTelegram kanal: @Habibullayev28 \nAdmin: @Habibullayev_28"
        );
      }

      // "stat1728" matni yuborilsa, foydalanuvchilar sonini ko'rsatish
      if (msg.text === "/stat") {
        const userCount = users.length;
        bot.sendMessage(
          chatId,
          `📊 Botdagi foydalanuvchilar soni: ${userCount}`
        );
      }
    }
  });
});

loadUsers();
