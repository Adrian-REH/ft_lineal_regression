package com._madrid.linear_regression_service.application;

import com._madrid.linear_regression_service.Model.Rect;
import com._madrid.linear_regression_service.Model.TrainCTX;
import com._madrid.linear_regression_service.Utils.Utils;
import com._madrid.linear_regression_service.application.dto.RectResponse;
import com._madrid.linear_regression_service.infrastructure.datastore.ModelState;
import com._madrid.linear_regression_service.infrastructure.datastore.ModelStore;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.util.List;

@Service
public class TrainService {

    private final ModelStore modelStore;

    public TrainService(ModelStore modelStore) {
        this.modelStore = modelStore;
    }

    /**
     * @return Rectas resultantes
     */
    public Flux<ServerSentEvent<RectResponse>> execute() {
        TrainCTX ctx = modelStore.getTrainCtx();
        ModelState modelState = modelStore.getModelState();
        if (ctx == null)
            return Flux.just(
                    ServerSentEvent.<RectResponse>builder()
                            .event("error")
                            .data(new RectResponse(0.0, 0.0, 0))
                            .build()
            );
        if (!modelState.equals(ModelState.FILE_PROCESSED)) {
            return Flux.just(
                    ServerSentEvent.<RectResponse>builder()
                            .event("error")
                            .comment("Invalid model state: " + modelState)
                            .build()
            );
        }
        double xMean = Utils.mean(ctx.xDom());
        double xStd = Utils.std(ctx.xDom());
        List<Double> xDomN = ctx.xDom().stream().map(val -> (val - xMean) / xStd).toList();

        return Flux.range(0, ctx.iterations())
                .scan(new RectResponse(0.0, 0.0, 0), (model, idx) -> {
                    //Diferencial del Error Cuadratico medio respecto a m
                    double dM = 0;
                    //Diferencial del Error Cuadratico medio respecto a b
                    double dB = 0;

                    for (int i = 0; i < ctx.yDom().size(); i++) {
                        double yPredicted = model.getM() * xDomN.get(i) + model.getB();
                        Double diff = yPredicted - ctx.yDom().get(i);
                        dM += (diff * xDomN.get(i));
                        dB += (diff);
                    }
                    dM /= ctx.n();
                    dB /= ctx.n();

                    double newM = model.getM() - ctx.learningRate() * dM;
                    double newB = model.getB() - ctx.learningRate() * dB;
                    return new RectResponse(newM, newB, idx);
                })
                .skip(1)
                .map(model -> ServerSentEvent.<RectResponse>builder()
                        .event("iteration")
                        .data(denormalize(model, xMean, xStd))
                        .build()
                )
                .doOnNext(lastValue -> modelStore.setCurrentRect(new Rect(lastValue.data().getM(),
                        lastValue.data().getB(),
                        lastValue.data().getIteration()))
                )
                .doOnComplete(() -> {
                    System.out.println("Training finished");
                    modelStore.updateState(ModelState.TRAINED);
                })
                .concatWith(
                        Mono.just(ServerSentEvent.<RectResponse>builder()
                                .event("complete")
                                .data(new RectResponse(modelStore.getRect().getM(),
                                        modelStore.getRect().getB(),
                                        modelStore.getRect().getIteration()))
                                .build()
                        )
                )
                .delayElements(Duration.ofMillis(10))
                .subscribeOn(Schedulers.boundedElastic())
                .onErrorResume(e ->
                        Flux.just(
                                ServerSentEvent.<RectResponse>builder()
                                        .event("error")
                                        .comment(e.getMessage())
                                        .build()
                        )
                );
    }

    private RectResponse denormalize(RectResponse rect, double xMean, double xStd) {
        var mResult = rect.getM() / xStd;
        var bResult = rect.getB() - (mResult * xMean);
        return new RectResponse(mResult, bResult, rect.getIteration());
    }
}
