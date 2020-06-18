const mongoose = require("mongoose");
const Event = require("./models/event");

const data = [
    {
        name: "The Square Small Business Hackathon",
        url: "https://square.devpost.com/?ref_feature=challenge&ref_medium=home",
        minGroupSize: 1,
        maxGroupSize: 5
    },
    {
        name: "HackBangPH",
        url: "https://hackbangph.devpost.com/?ref_feature=challenge&ref_medium=home",
        minGroupSize: 2,
        maxGroupSize: 4
    },
    {
        name: "Facebook Hackathon: AI",
        url: "https://fbai2.devpost.com/?ref_feature=challenge&ref_medium=home",
        minGroupSize: 1,
        maxGroupSize: 4
    },
    {
        name: "Airtable Block Contest",
        url: "https://airtable.devpost.com/?ref_feature=challenge&ref_medium=home",
        minGroupSize: 1,
        maxGroupSize: 1
    }
];

function seedDB(){
    Event.deleteMany({}, (err) => {
        if(err){
            console.log(err);
        } else {
            console.log("REMOVED EVENTS")
            data.forEach((seed) => {
                Event.create(seed, (err, event) => {
                    if(err){
                        console.log(err);
                    } else{
                        console.log("added event");
                    }
                })
            })
        }
    });
}

module.exports = seedDB;