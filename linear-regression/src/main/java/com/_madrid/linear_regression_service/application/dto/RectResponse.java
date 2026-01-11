package com._madrid.linear_regression_service.application.dto;

public class RectResponse {
    private Double m;
    private Double b;
    private int iteration;

    public RectResponse(Double m, Double b, int iteration) {
        this.m = m;
        this.b = b;
        this.iteration = iteration;
    }

    public Double getM() {
        return m;
    }

    public void setM(Double m) {
        this.m = m;
    }

    public Double getB() {
        return b;
    }

    public void setB(Double b) {
        this.b = b;
    }

    public int getIteration() {
        return iteration;
    }

    public void setIteration(int iteration) {
        this.iteration = iteration;
    }
}
