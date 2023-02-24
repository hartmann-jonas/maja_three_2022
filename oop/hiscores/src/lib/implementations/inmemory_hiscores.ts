import { Implementation, type Hiscores } from "$lib/do_not_modify/hiscores";
import type { Leaderboard } from "$lib/do_not_modify/leaderboard";
import { JumpPlayer } from "$lib/do_not_modify/player";
import { DefaultRank } from "$lib/do_not_modify/rank";
import type {
  GetLeaderboardsRequest,
  GetLeaderboardsResponse,
  CreateLeaderboardRequest,
  CreateLeaderboardResponse,
  DeleteLeaderboardRequest,
  DeleteLeaderboardResponse,
  GetScoresRequest,
  GetScoresResponse,
  SubmitScoreRequest,
  SubmitScoreResponse,
  GetRanksForPlayerRequest,
  GetRanksForPlayerResponse,
} from "$lib/do_not_modify/requests";
import { JumpScore, type Score } from "$lib/do_not_modify/score";

import 'colorts/lib/string';

// LEADERBOARD IS REPRESENTED AS A MAP OF KEY - VALUE PAIRS
// THE KEY IS THE LEADERBOARD_ID, THE VALUE IS THE LEADERBOARD ITSELF
// WE CAN LATER USE SET/GET/DELETE TO CREATE/READ/DELETE LEADERBOARDS
// WE CAN GET THE LEADERBOARD TO GET THE SCORES AND UPDATE THE SCORES
let leaderboards: Map<string, Leaderboard & {save: boolean}> = new Map();

export class InMemoryHiscores implements Hiscores {
  implementation: Implementation = Implementation.INMEMORY;
  
  async get_leaderboards(
    request: GetLeaderboardsRequest
  ): Promise<GetLeaderboardsResponse> {

    // NO NEED TO TOUCH THIS. IMPLEMENTATION FINISHED
    // THE RESPONSE SHOULD RETURN THE IDS FOR ALL LEADERBOARDS
    // GETTING THE KEYS FOR THE MAP GETS THE IDS FOR THE LEADERBOARDS  
      
    const response: GetLeaderboardsResponse = {
      success: true,
      leaderboards: [...leaderboards.keys()],
    };

    return response;
  }
  async create_leaderboard(
    request: CreateLeaderboardRequest
  ): Promise<CreateLeaderboardResponse> {

    console.log(("CreateLeaderboardRequest").magenta);
    let createSuccess = false

    if(leaderboards.has(request.leaderboard_id)){
      console.log(("Leaderboard already exists").red)
      createSuccess = false
    } {
      leaderboards.set(request.leaderboard_id, {
        id: request.leaderboard_id,
        scores: [],
        save: request.save_multiple_scores_per_player
      })
      console.log(("Created leaderboard " + request.leaderboard_id).green.bold)
      createSuccess = true
    }

    const response: CreateLeaderboardResponse = {
      success: createSuccess,
    };
    return response;
  }
  async delete_leaderboard(
    request: DeleteLeaderboardRequest
  ): Promise<DeleteLeaderboardResponse> {

    console.log(("DeleteLeaderboardRequest").magenta);
    let deleteSuccess = false

    if(leaderboards.has(request.leaderboard_id)){
      leaderboards.delete(request.leaderboard_id)
      console.log(("Leaderboard " + request.leaderboard_id + " deleted").red)
      deleteSuccess = true
    } else {
      deleteSuccess = false
    }

    const response: DeleteLeaderboardResponse = {
      success: deleteSuccess,
    };
    return response;
  }
  async get_scores_from_leaderboard(
    request: GetScoresRequest
  ): Promise<GetScoresResponse> {

    console.log(("GetScoresRequest").magenta);
    let getSuccess;
    let scores: Score[];


    if(leaderboards.has(request.leaderboard_id)){
      const userLeaderboard = leaderboards.get(request.leaderboard_id)!
      let userScores = [...userLeaderboard.scores]
      if(userScores) {
        scores = userScores.splice(request.start_index, request.end_index)
        getSuccess = true
        console.log(("Recieved Leaderboards").green.bold)
      } else {
        getSuccess = false
        console.log(("Recieveing Leaderboards failed").red)
      }
    } else {
      getSuccess = false
      console.log(("Recieveing Leaderboards failed").red)
    }



    const response: GetScoresResponse = {
      success: getSuccess,
      scores: scores!,
    };

    return response;
  }
  async submit_score_to_leaderboard(
    request: SubmitScoreRequest
  ): Promise<SubmitScoreResponse> {
    let submitSuccess = false
    console.log(("SubmitScoreRequest").magenta);

    if(leaderboards.has(request.leaderboard_id)){
      const userLeaderboard = leaderboards.get(request.leaderboard_id)!
      let save = userLeaderboard.save
      // function to sort the scores
      function sortScores() {
        userLeaderboard.scores.sort((a, b)=> a.value - b.value);
        userLeaderboard.scores.reverse()
        return userLeaderboard;
      }
      if (userLeaderboard.scores.length < 1 || save == true) {
        // if leaderboard is empty or save multiple, push score to leaderboard
        userLeaderboard.scores.push(request.score)
        console.log(("User " + request.score.player.id + " has created a new score in leaderboard " + userLeaderboard.id).green.bold)
        sortScores()
        submitSuccess = true
      } else {
        let create = true
        let index = 0
        // get all scores from leaderboard that is not save multiple
        userLeaderboard.scores.forEach(score => {
          // search if user has a score in the leaderboard
          if (score.player.id === request.score.player.id) {
            create = false
            console.log(("Score for " + request.score.player.id + " in leaderboard " + userLeaderboard.id +" found").blue)
            // if submitted score is higher than score in leaderboard
            if (score.value < request.score.value) {
              console.log(("User " + request.score.player.id + " has updated his score in leaderboard " + userLeaderboard.id).green.bold)
              // replace score
              userLeaderboard.scores.splice(index, 1, request.score)
              sortScores()
              submitSuccess = true;
            } else {
              console.log(("Submitted score for " + request.score.value + " is lower than " + score.value).red)
              submitSuccess = false;
            }
          }
          index++;
        });
        // if user has no score in leaderboard - add the submitted score
        if (create) {
          console.log(("No score for " + request.score.player.id + " in leaderboard " + userLeaderboard.id +" found, creating new one").yellow)
          console.log(("User " + request.score.player.id + " has created a new score in leaderboard " + userLeaderboard.id).green.bold)
          userLeaderboard.scores.push(request.score)
          sortScores()
          submitSuccess = true;
        }
      }
    }

    const response: SubmitScoreResponse = {
      success: submitSuccess,
      rank: new DefaultRank(
        0,
        request.leaderboard_id,
        new JumpScore(request.score.value, request.score.date, new JumpPlayer(request.score.player.id, 9001))
      ),
    };
    return response;
  }
  async get_all_ranks_for_player(
    request: GetRanksForPlayerRequest
  ): Promise<GetRanksForPlayerResponse> {
    console.log(("GetRanksForPlayerRequest").magenta);

    let scoreId
    let scoreVal
    let scoreInd

    const response: GetRanksForPlayerResponse = {
      success: false,
      ranks: []
    };

    leaderboards.forEach(leaderboard => {
      leaderboard.scores.forEach((score,index) => {
        if (score.player.id === request.player_id) {
          console.log(("Score for user " + request.player_id + " in leaderboard " + leaderboard.id + " found").green)
          scoreId = leaderboard.id
          scoreVal = score
          scoreInd = index
          response.success = true
          response.ranks.push({
            index: index,
            leaderboard_id: leaderboard.id,
            score: score
          })
        } else {
          console.log(("No rank for player in the leaderboards").red)
        }
      })
    });

    return response;
  }
}
