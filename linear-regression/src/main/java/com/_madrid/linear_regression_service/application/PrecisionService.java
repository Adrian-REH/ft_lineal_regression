package com._madrid.linear_regression_service.application;

import com._madrid.linear_regression_service.Model.Rect;
import com._madrid.linear_regression_service.Model.TrainCTX;
import com._madrid.linear_regression_service.infrastructure.datastore.ModelState;
import com._madrid.linear_regression_service.infrastructure.datastore.ModelStore;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import java.util.stream.Stream;

@Service
public class PrecisionService {

    private final ModelStore modelStore;

    public PrecisionService(ModelStore modelStore) {
        this.modelStore = modelStore;
    }

    public Mono<Map<String, Double>> execute() {
        if (!modelStore.getModelState().equals(ModelState.TRAINED)) return Mono.empty();

        Rect rect = modelStore.getRect();
        TrainCTX ctx = modelStore.getTrainCtx();

        var sumSquared = 0.0;
        for (int i = 0; i < ctx.n(); i++) {
            var yPredict = rect.getM() * ctx.xDom().get(i) + rect.getB();
            sumSquared  += Math.pow( ctx.yDom().get(i) - yPredict, 2);
        }
        double rmse = Math.sqrt(sumSquared / ctx.n());

        return Mono.just(Map.of("RMSE", rmse));
    }
}
