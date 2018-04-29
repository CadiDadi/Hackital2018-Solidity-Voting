App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    // Load Artists.
    $.getJSON('../Artists.json', function(data) {
      var ArtistsRow = $('#ArtistsRow');
      var ArtistTemplate = $('#ArtistTemplate');

      for (i = 0; i < data.length; i ++) {
        ArtistTemplate.find('.panel-title').text(data[i].name);
        ArtistTemplate.find('img').attr('src', data[i].picture);
        ArtistTemplate.find('.Artist-breed').text(data[i].breed);
        ArtistTemplate.find('.Artist-age').text(data[i].age);
        ArtistTemplate.find('.Artist-location').text(data[i].location);
        ArtistTemplate.find('.btn-vote').attr('data-id', data[i].id);

        ArtistsRow.append(ArtistTemplate.html());
      }
    });

    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Voting.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var VotingArtifact = data;
    App.contracts.Voting = TruffleContract(VotingArtifact);

    // Set the provider for our contract
    App.contracts.Voting.setProvider(App.web3Provider);

    // Use our contract to retrieve and mark the voteed Artists
    return App.markVoteed();
  });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-vote', App.handleVote);
  },

  markVoteed: function(voteers, account) {
    var votingInstance;

    App.contracts.Voting.deployed().then(function(instance) {
      votingInstance = instance;

      return votingInstance.getVoteers.call();
    }).then(function(voteers) {
      for (i = 0; i < voteers.length; i++) {
        if (voteers[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-Artist').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleVote: function(event) {
    event.preventDefault();

    var ArtistId = parseInt($(event.target).data('id'));

    var votingInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Voting.deployed().then(function(instance) {
        votingInstance = instance;

        // Execute vote as a transaction by sending account
        return votingInstance.vote(ArtistId, {from: account});
      }).then(function(result) {
        return App.markVoteed();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
