package com._madrid.linear_regression_service.Model;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public record TrainCTX(List<Vector2> vector2s , int iterations, Double learningRate, int n, List<Double> xDom, List<Double> yDom) {

    public TrainCTX addXDom(Double x) {
        List<Double> newX = new ArrayList<>(xDom);
        newX.add(x);
        return new TrainCTX(vector2s, iterations, learningRate, n, newX, yDom);
    }

    public TrainCTX addYDom(Double y) {
        List<Double> newY = new ArrayList<>(yDom);
        newY.add(y);
        return new TrainCTX(vector2s, iterations, learningRate, n, xDom, newY);
    }
    public TrainCTX incrementN() {
        return new TrainCTX(vector2s, iterations, learningRate, n + 1, xDom, yDom);
    }

    public TrainCTX updateIterations(int iterations) {
        return new TrainCTX(vector2s, iterations, learningRate, n, xDom, yDom);
    }
    public TrainCTX updateLearningRate(Double learningRate) {
        return new TrainCTX(vector2s, iterations, learningRate, n, xDom, yDom);
    }

    public TrainCTX cleanData() {
        return new TrainCTX(vector2s, iterations, learningRate, 0, List.of(), List.of());
    }

    public TrainCTX addVector2s(Vector2 vector2) {
        List<Vector2> newVector2s = new ArrayList<>(vector2s);
        newVector2s.add(vector2);
        return new TrainCTX(newVector2s, iterations, learningRate, n, xDom, yDom);

    }
}
