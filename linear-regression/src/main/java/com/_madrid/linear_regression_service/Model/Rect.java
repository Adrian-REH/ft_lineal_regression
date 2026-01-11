package com._madrid.linear_regression_service.Model;

public class Rect {
    private double m;
    private double b;
    private int iteration;

    public Rect(double m, double b, int iteration) {
        this.m = m;
        this.b = b;
        this.iteration = iteration;
    }

    public double getM() {
        return m;
    }

    public void setM(double m) {
        this.m = m;
    }

    public double getB() {
        return b;
    }

    public void setB(double b) {
        this.b = b;
    }

    public int getIteration() {
        return iteration;
    }

    public void setIteration(int iteration) {
        this.iteration = iteration;
    }
}
