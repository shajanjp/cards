let express = require('express');
let bodyParser = require('body-parser')
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);

let users = {}

app.use('/public', express.static('public'))

app.get('/', (req, res) => {
  res.json({status: true})
})

let allCards = ["S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "SJ", "SQ", "SK", "SA", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "H10", "HJ", "HQ", "HK", "HA", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "DJ", "DQ", "DK", "DA", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "CJ", "CQ", "CK", "CA"];

function generateRandomNumber(min, max){
  return Math.floor(Math.random() * (max-min) + min);
}

function shaffle(ordered){
  let newSet = ordered.slice();
  let ready = [];
  for(let i=newSet.length; i>0; i--){
    let r = generateRandomNumber(0, i);
    ready.push(newSet.splice(r, 1)[0])
  }
  return ready;
}

let shuffled = shaffle(allCards);

function reShuffleCards(){
  shuffled = shaffle(allCards);
  console.log('on reShuffleCards');
  let shuffledSet = []
  console.log('shuffled length', shuffled.length);
  for(let i=0; i<shuffled.length;){
    for(let j=0; (j<Object.keys(users).length && (i<shuffled.length)); j++){
      if(Array.isArray(shuffledSet[j]))
      {
        shuffledSet[j].push(shuffled[i++])
      }
      else{
        shuffledSet[j] = [shuffled[i++]]
      }
    }
  }
  console.log('shuffledSet', shuffledSet);
  let c = 0;

  Object.keys(users).forEach(user => {
    io.to(user).emit('CARD_SHUFFLED', { cards: shuffledSet[c++] })
  })
}


io.on('connection', (client) => {
  users[client.id] = {
    fullname: "Player W",
    color: "red",
    id: client.id
  }
  console.log('connection: ', users);
  client.emit('MY_DETAILS', users[client.id])

  io.emit('USERS_UPDATE', { users: users })

  client.on('NAME_UPDATE', data => {
    console.log('request NAME_UPDATE');
    users[client.id] = {
      fullname: data.fullname,
      color: "red",
      id: client.id
    }
    client.emit('MY_DETAILS', users[client.id])
    io.emit('USERS_UPDATE', { users: users })
  })

  client.on('JOIN', data => {
    console.log('request JOIN');
    io.emit('NEW_JOIN', {user: users[client.id]})
  });
 
  client.on('NEW_GAME', data => {
    console.log('request NEW_GAME');
    reShuffleCards();
  });

  client.on('NEW_CHAT', data => {
    console.log('request NEW_CHAT');
    io.emit('NEW_CHAT', {fullname: users[client.id].fullname, text: data.text});
  });  

  client.on('DISCARD', data => {
    console.log('request DISCARD');
    io.emit('DISCARD', {});
  });  

  client.on('ADD_TO_TABLE', data => {
    console.log('request ADD_TO_TABLE');
    io.emit('TABLE_UPDATED', { card: {title: data.card}, user: users[client.id]})
  })

  client.on('disconnect', () => {
    delete users[client.id];
    io.emit('USERS_UPDATE', { users: users })
    console.log('updated users', users);
    console.log('disconnected'); 
  });

});

http.listen(3000);