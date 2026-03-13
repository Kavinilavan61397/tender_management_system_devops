const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server/.env') });

const Bid = require('./server/models/Bid');
const Approval = require('./server/models/Approval');
const Tender = require('./server/models/Tender');

async function checkSpecificTender() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const tenderId = '69a5955f0764559228c1cb7e';

        const tender = await Tender.findById(tenderId);
        console.log(`\nTender: ${tender?.title} (${tender?.status})`);

        const bids = await Bid.find({ tender: tenderId }).populate('vendor', 'name');
        console.log(`\n--- Bids for this Tender (${bids.length}) ---`);
        bids.forEach(b => {
            console.log(`ID: ${b._id}, Vendor: ${b.vendor?.name}, Status: ${b.status}, CreatedAt: ${b.createdAt}`);
        });

        const approval = await Approval.findOne({ tender: tenderId });
        if (approval) {
            console.log(`\n--- Approval Workflow ---`);
            console.log(`ID: ${approval._id}, Status: ${approval.overallStatus}, CurrentStep: ${approval.currentStep}`);
            approval.steps.forEach((s, i) => {
                console.log(`Step ${i}: Role: ${s.role}, Status: ${s.status}, Approver: ${s.approver}`);
            });
        } else {
            console.log('\nNo approval workflow initiated for this tender.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkSpecificTender();
