import gym
import connect4_gym
import numpy as np
import random
import operator
import pickle
import pygame
import sys
from pygame.locals import *
import matplotlib.pyplot as plt

class QLearning:
    def __init__(self, q_table={}, alpha=0.1, gamma=0.6, epsilon=0.1):
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = 1  # epsilon
        self.epsilon_min = 0.01  # epsilon
        self.epsilon_decay = 0.995  #epsilon
        self.env = gym.make('Connect4-v0')
        self.q_table = q_table
        self.state = self.get_current_state()
        self.valid_actions = self.get_available_moves()

    def get_current_state(self):
        return self.env.board.board

    def get_qvalue(self, state, action=None):
        key = str(state)
        if key in self.q_table.keys():
            if action is None:
                return self.q_table[key]
            if action in self.q_table[key].keys():
                return self.q_table[key][action]
        elif action is None:
            return {}
        return 0

    def get_best_move(self, state, training=True):
        if training and random.uniform(0, 1) < self.epsilon:
            return random.sample(self.get_available_moves(), 1)[0]
        else:
            try:
                action = max(self.get_qvalue(state).iteritems(), key=operator.itemgetter(1))[0]
            except:
                action = random.sample(self.get_available_moves(), 1)[0]
            return action

    def update_qvalue(self, state, action, reward, next_state):
        if reward == 1:
            key = str(state)
            if key in self.q_table.keys():
                self.q_table[key][action] = 1
            else:
                self.q_table[key] = {action: 1}
            return
        # update Q Table
        old_q = self.get_qvalue(state, action)
        try:
            next_max = max(self.get_qvalue(next_state).items(), key=operator.itemgetter(1))[1]
        except ValueError as e:
            next_max = 0
        new_q = (1 - self.alpha) * old_q + self.alpha * (reward + self.gamma * next_max)

        key = str(state)
        if key in self.q_table.keys():
            self.q_table[key][action] = new_q
        else:
            self.q_table[key] = {action: new_q}

    def get_available_moves(self):
        valid_actions = []
        for col in range(self.state.shape[1]):
            if self.env.board.column_fill[col] != self.state.shape[0]:
                valid_actions.append(col)
        return valid_actions

    def take_action(self,state, training):
        action = self.get_best_move(state, training)
        next_state, reward, done, info = self.env.step(action)
        next_state = self.get_current_state()
        self.update_qvalue(state, action, reward, next_state)
        return action, reward, info

    def train(self, n_episodes=10):#00000):
        """Training the agent"""
        training = True
        for i in range(1, n_episodes):
            if self.epsilon >= self.epsilon_min:
                self.epsilon *= self.epsilon_decay

            self.env.reset()
            state = self.get_current_state()

            epochs, penalties, reward = 0, 0, 0
            done = False

            while not done:
                if len(self.get_available_moves()) == 0:
                    print("match draw!!")
                    break

                # player 1 : Agent

                agent_action, reward, info = self.take_action(state, training)
                #self.env.render()

                if reward == 1:
                    break

                # player 2

                if len(self.get_available_moves()) is 0:
                    print("match draw!!")
                    break
                p2_action = random.sample(self.get_available_moves(), 1)[0]
                next_state, reward, done, info = self.env.step(p2_action)
                #self.env.render()
                epochs += 1
                if reward == 1:
                    key = str(state)
                    if key in self.q_table.keys():
                        self.q_table[key][agent_action] = -1
                    else:
                        self.q_table[key] = {agent_action: -1}
                    break

            if i % 100 == 0:
                # clear_output(wait=True)
                print(f"Episode: {i}")
                print(len(self.q_table))

        print("Training finished.\n")
        print(len(self.q_table))
        with open('q_table.pickle', 'wb') as handle:
            pickle.dump(self.q_table, handle, protocol=pickle.HIGHEST_PROTOCOL)

    def gameplay(self, metrics=False):
        while True:
            self.env.reset()
            state = self.state

            done = False

            while not done:
                if len(self.get_available_moves()) == 0:
                    print("match draw!!")
                    break

                # player 1 : Agent
                try:
                    agent_action = max(self.get_qvalue(state).items(), key=operator.itemgetter(1))[0]
                except:
                    agent_action = random.sample(self.get_available_moves(), 1)[0]

                next_state, reward, done, info = self.env.step(agent_action)
                next_state = self.env.board.board

                if not metrics:
                    self.env.render()
                if reward == 1:
                    print("player 1 wins")
                    if metrics:
                        return 1, 0
                    pygame.time.wait(3000)
                    sys.exit()
                    break

                # player 2 : Take user Input
                if len(self.get_available_moves()) == 0:
                    print("match draw!!")
                    break

                if metrics:
                    action = random.sample(self.get_available_moves(), 1)[0]
                else:
                    while True:
                        event = pygame.event.wait()
                        if event.type == QUIT:
                            pygame.quit()
                            sys.exit()
                        elif event.type == KEYDOWN and 256 < event.key < 264:
                            action = int(event.key - 257)
                            break

                next_state, reward, done, info = self.env.step(action)
                if not metrics:
                    self.env.render()
                if reward == 1:
                    print("player 2 wins")
                    if metrics:
                        return 0, 1
                    pygame.time.wait(3000)
                    sys.exit()

    def get_result_metrics(self, n_games=100):
        p1, p2 = 0, 0
        fig = plt.figure()
        for i in range(n_games):
            print("Playing Game: {}".format(i))
            p1_new, p2_new = self.gameplay(metrics=True)
            p1 += p1_new
            p2 += p2_new
            if i % 100 == 0:
                plt.plot(i, p1, 'bo')
                plt.plot(i, p2, 'ro')
                p1, p2 = 0, 0
        print("player 1 wins: {}".format(p1))
        print("player 2 wins: {}".format(p2))
        plt.title('Game wins by each agent')
        plt.legend(['Q Learning Agent', 'Random Agent'])
        plt.show()


if __name__=="__main__":
    with open('../q_table_1.pickle', 'rb') as file:
        q_table = pickle.load(file)
    agent = QLearning(q_table=q_table, epsilon=0)
    #agent = QLearning()
    #agent.train()
    #agent.gameplay()
    agent.get_result_metrics(1000)