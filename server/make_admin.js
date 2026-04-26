const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sinema');
    
    const username = 'aryannn'; // 👈 CHANGE THIS TO YOUR USERNAME
    const updated = await User.findOneAndUpdate(
        { username },
        { $set: { isAdmin: true } },
        { new: true }
    );
    
    if (updated) {
        console.log(`✅ ${username} is now admin!`);
        console.log(`   Email: ${updated.email}`);
        console.log(`   Created: ${updated.createdAt}`);
    } else {
        console.log('❌ User not found. Available users:');
        const users = await User.find().select('username');
        users.forEach(u => console.log(`   - ${u.username}`));
    }
    
    process.exit();
})();