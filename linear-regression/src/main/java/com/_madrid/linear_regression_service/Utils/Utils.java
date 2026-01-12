package com._madrid.linear_regression_service.Utils;

import java.util.List;
import java.util.Optional;

public class Utils {

    /**
     * Media Aritmetica
     * @param xDom
     * @return
     */
    public static double mean(List<Double> xDom) {
        Optional<Double> result =  xDom.stream().reduce(Double::sum);
        return result.map(aDouble -> aDouble / xDom.size()).orElse(0.0);
    }

    /**
     * Algorithms for calculating variance, Welford
     *
     * @return
     */
    public static double variance(List<Double> xDom) {
        int n = 0;
        double mean = 0.0;
        double m2 = 0.0;

        for (double x : xDom) {
            n++;
            //Media incremental durante la iteración
            double delta = x - mean;
            mean += delta / n;
            double delta2 = x - mean;
            m2 += delta * delta2;
        }
        return n > 0 ? m2 / n : 0.0;
    }
    /**
     * Desviacion estandar poblacional
     * @param xDom
     * @return
     */
    public static Double std(List<Double> xDom) {
        return Math.sqrt(variance(xDom));
    }
}
