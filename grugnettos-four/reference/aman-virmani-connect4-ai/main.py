import pickle
from utils.qlearning import QLearning

if __name__=="__main__":
    with open('./q_table_1.pickle', 'rb') as file:
        q_table = pickle.load(file)
    agent = QLearning(q_table)
    agent.get_result_metrics(1000)
