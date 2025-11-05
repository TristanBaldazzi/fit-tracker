const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending'
  },
  
  // Métadonnées
  requestedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour les recherches
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendSchema.index({ recipient: 1, status: 1 });
friendSchema.index({ requester: 1, status: 1 });

// Middleware pour mettre à jour acceptedAt
friendSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'accepted' && !this.acceptedAt) {
    this.acceptedAt = new Date();
  }
  next();
});

// Méthode statique pour obtenir les amis d'un utilisateur
friendSchema.statics.getFriends = async function(userId) {
  const friends = await this.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  }).populate('requester recipient', 'username firstName lastName avatar level xp totalSessionsCompleted');
  
  return friends.map(friendship => {
    const friend = friendship.requester._id.equals(userId) 
      ? friendship.recipient 
      : friendship.requester;
    
    return {
      _id: friend._id,
      username: friend.username,
      firstName: friend.firstName,
      lastName: friend.lastName,
      avatar: friend.avatar,
      level: friend.level,
      xp: friend.xp,
      totalSessionsCompleted: friend.totalSessionsCompleted || 0,
      friendshipId: friendship._id,
      acceptedAt: friendship.acceptedAt
    };
  });
};

// Méthode statique pour obtenir les demandes d'amitié en attente
friendSchema.statics.getPendingRequests = async function(userId) {
  return await this.find({
    recipient: userId,
    status: 'pending'
  }).populate('requester', 'username firstName lastName avatar level xp');
};

// Méthode statique pour vérifier si deux utilisateurs sont amis
friendSchema.statics.areFriends = async function(userId1, userId2) {
  const friendship = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2, status: 'accepted' },
      { requester: userId2, recipient: userId1, status: 'accepted' }
    ]
  });
  
  return !!friendship;
};

// Méthode statique pour créer une demande d'amitié
friendSchema.statics.sendFriendRequest = async function(requesterId, recipientId) {
  // Vérifier qu'il n'y a pas déjà une demande
  const existingRequest = await this.findOne({
    $or: [
      { requester: requesterId, recipient: recipientId },
      { requester: recipientId, recipient: requesterId }
    ]
  });
  
  if (existingRequest) {
    throw new Error('Une demande d\'amitié existe déjà entre ces utilisateurs');
  }
  
  // Vérifier qu'on ne s'ajoute pas soi-même
  if (requesterId.equals(recipientId)) {
    throw new Error('Vous ne pouvez pas vous ajouter comme ami');
  }
  
  return await this.create({
    requester: requesterId,
    recipient: recipientId,
    status: 'pending'
  });
};

// Méthode statique pour accepter une demande d'amitié
friendSchema.statics.acceptFriendRequest = async function(friendshipId, userId) {
  const friendship = await this.findOne({
    _id: friendshipId,
    recipient: userId,
    status: 'pending'
  });
  
  if (!friendship) {
    throw new Error('Demande d\'amitié non trouvée');
  }
  
  friendship.status = 'accepted';
  friendship.acceptedAt = new Date();
  
  return await friendship.save();
};

// Méthode statique pour refuser/supprimer une demande d'amitié
friendSchema.statics.removeFriendRequest = async function(friendshipId, userId) {
  const friendship = await this.findOne({
    _id: friendshipId,
    $or: [
      { requester: userId },
      { recipient: userId }
    ]
  });
  
  if (!friendship) {
    throw new Error('Demande d\'amitié non trouvée');
  }
  
  return await this.findByIdAndDelete(friendshipId);
};

module.exports = mongoose.model('Friend', friendSchema);


