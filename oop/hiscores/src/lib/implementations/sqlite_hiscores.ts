import { Implementation, type Hiscores } from "$lib/do_not_modify/hiscores";
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
import { JumpScore } from "$lib/do_not_modify/score";
import { xlink_attr } from "svelte/internal";

import 'colorts/lib/string';

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export class SQLiteHiscores implements Hiscores {
  implementation: Implementation = Implementation.SQLITE;

  async get_leaderboards(
    request: GetLeaderboardsRequest
  ): Promise<GetLeaderboardsResponse> {
    // TODO: implement logic

    console.log(("GetLeaderboardsResponse").magenta);
    //console.log(request);

    const response: GetLeaderboardsResponse = {
      success: true,
      leaderboards: [], // get all entries from Leaderboards prisma table
    };


    return response;
  }
  async create_leaderboard(
    request: CreateLeaderboardRequest
  ): Promise<CreateLeaderboardResponse> {
    request.leaderboard_id
    request.save_multiple_scores_per_player

    console.log(("CreateLeaderboardRequest").magenta);
    let createSuccess = false
    //  prisma find or create
    let leaderboard = await prisma.leaderboard.upsert({
      where: {
        leaderboardId: request.leaderboard_id
      },
      update: {},
      create: {
        leaderboardId: request.leaderboard_id,
        saveMultiple:  request.save_multiple_scores_per_player
      }
    })
    console.log("LEADERBOARD")
    // if found or created leaderboard has same id
    if ((leaderboard).leaderboardId === request.leaderboard_id) {
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

    console.log("DeleteLeaderboardRequest");
    let deleteSuccess = false

    const leaderboard = await prisma.leaderboard.delete({
      where: {
        leaderboardId: request.leaderboard_id
      }
    })

    if (await leaderboard) {
      deleteSuccess = true
    }

    const response: DeleteLeaderboardResponse = {
      success: deleteSuccess,
    };
    return response;
  }
  async get_scores_from_leaderboard(
    request: GetScoresRequest
  ): Promise<GetScoresResponse> {

    console.log("GetScoresRequest");
    let scores = new Array

    function sortScores(x) {
      x.sort((a, b)=> a.value - b.value);
      x.reverse()
      return x;
    }

    // get all scores from requested leaderboard
    // push all the scores in new array
    // sort array from hightest score to lowest
    const scoreRes = await prisma.scores.findMany({
      where: {
        // why cant i find all the scores related to one leaderboard
        leaderboardId: request.leaderboard_id
      }
    })

    if (scoreRes) {
      scoreRes.forEach(score => {
        scores.push(score)
      })
      sortScores(scores)
      const response: GetScoresResponse = {
        success: true,
        scores: scores,
      }
    } else {
      // false response here
    }
    const response: GetScoresResponse = {
      success: false,
      scores: [],
    };
    // change way to handle response
    return response;
  }
  async submit_score_to_leaderboard(
    request: SubmitScoreRequest
  ): Promise<SubmitScoreResponse> {

    console.log("SubmitScoreRequest");

    const leaderboard = await prisma.leaderboard.findUnique({
      where: {
        leaderboardId: request.leaderboard_id
      }
    })
    if (leaderboard) {
      if (leaderboard.saveMultiple) {
        await prisma.scores.create({
          data: {
            leaderboardId: {
              connect: {
                leaderboardId: request.leaderboard_id
              }
            },
            userId: request.score.player.id,
            value: request.score.value,
            date: request.score.date,
          }
        })
      } else {
        await prisma.scores.upsert({
          where: {
              // why doesnt that work?
              // BIG FLAW, IF USER HAS MULTIPLE SCORES IN DIFFERENT
              // LEADERBOARDS IT WOULD FIND ALL RECORDS AND UPDATE THEM
              // SOLUTION:  ?
              userId: request.score.player.id
          },
          update: {
            // function in here?
          },
          create: {
            leaderboardId: {
              connect: {
                leaderboardId: request.leaderboard_id,
              }
            },
            userId: request.score.player.id,
            value: request.score.value,
            date: request.score.date,
          },
        })
      }
    }

    const response: SubmitScoreResponse = {
      success: false,
      rank: new DefaultRank(
        0,
        "foo",
        new JumpScore(1337, new Date(), new JumpPlayer("bar", 9001))
      ),
    };

    return response;
  }
  async get_all_ranks_for_player(
    request: GetRanksForPlayerRequest
  ): Promise<GetRanksForPlayerResponse> {
    // TODO: implement logic

    console.log("GetRanksForPlayerRequest");

    const leaderboards = await prisma.leaderboard.findMany()
    const response: GetRanksForPlayerResponse = {
      success: false,
      ranks: [],
    };

    return response;
  }
}
