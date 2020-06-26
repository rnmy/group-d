const mongoose = require("mongoose");
const Event = require("./models/event");
const Group = require("./models/group");
const User = require("./models/user");

const events = [
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

function seedDB() {
  Event.deleteMany({}, (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log("REMOVED EVENTS")
      events.forEach((seed) => {
        Event.create(seed, (err, event) => {
          if(err) {
            console.log(err)
          } else {
            console.log("Created event")
            User.deleteMany({}, (err) => {
              if(err) {
                console.log(err);
              } else {
                console.log("REMOVED USERS")
              }
            })
          }
        })
      })
    }
  })
}

// function seedDB(){
//     Event.deleteMany({}, (err) => {
//         if(err){
//             console.log(err);
//         } else {
//             console.log("REMOVED EVENTS")
//             events.forEach((seed) => {
//                 Event.create(seed, (err, event) => {
//                     if(err){
//                         console.log(err);
//                     } else {
//                       Group.create(
//                         {
//                           name: "Group 1",
//                           size: 1
//                         }, (err, group) => {
//                           if (err) {
//                             console.log(err)
//                           } else {
//                             User.create(
//                               {
//                                 name: "Jane",
//                                 email: "jane@brown.edu.sg",
//                                 username: "plainjane",
//                               }, (err, user) => {
//                                 if(err) {
//                                   console.log(err)
//                                 } else {
//                                   group.users.push(user)
//                                   group.save()
//                                   console.log("Created group")
//                                   event.groups.push(group)
//                                   event.save()
//                                   console.log("Created event")
//                                 }
//                               }
//                             )
//                           }
//                         }
//                       )
//                     }
//                   }
//                 )
//               }
//             )
//           }
//         }
//       )
//     }

module.exports = seedDB;
