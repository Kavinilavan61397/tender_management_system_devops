const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server/.env') });

const Bid = require('./server/models/Bid');
const Approval = require('./server/models/Approval');
const Tender = require('./server/models/Tender');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const recentBids = await Bid.find().populate('tender', 'title status').populate('vendor', 'name role').sort({ createdAt: -1 }).limit(5);
        console.log('\n--- Recent 5 Bids ---');
        recentBids.forEach(b => {
            console.log(`ID: ${b._id}, Tender: ${b.tender?.title} (${b.tender?.status}), Vendor: ${b.vendor?.name}, Status: ${b.status}, CreatedAt: ${b.createdAt}`);
        });

        const recentApprovals = await Approval.find().populate('tender', 'title').sort({ createdAt: -1 }).limit(5);
        console.log('\n--- Recent 5 Approvals ---');
        recentApprovals.forEach(a => {
            console.log(`ID: ${a._id}, Tender: ${a.tender?.title}, Status: ${a.overallStatus}, Step: ${a.currentStep}, CreatedAt: ${a.createdAt}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkData();
