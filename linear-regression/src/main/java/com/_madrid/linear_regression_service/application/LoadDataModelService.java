package com._madrid.linear_regression_service.application;

import com._madrid.linear_regression_service.Model.TrainCTX;
import com._madrid.linear_regression_service.Model.Vector2;
import com._madrid.linear_regression_service.infrastructure.datastore.ModelState;
import com._madrid.linear_regression_service.infrastructure.datastore.ModelStore;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class LoadDataModelService {

    private final ModelStore modelStore;

    public LoadDataModelService(ModelStore modelStore) {
        this.modelStore = modelStore;
    }


    public Mono<ResponseEntity<List<Vector2>>> execute(FilePart filePart) {
        TrainCTX initialCtx = modelStore.getTrainCtx().cleanData();
        return filePart.content()
                .map(dataBuffer -> {
                    if (dataBuffer.readableByteCount() <= 0) throw new RuntimeException("Invalid file part");
                    byte[] bytes = new byte[dataBuffer.readableByteCount()];
                    dataBuffer.read(bytes);
                    DataBufferUtils.release(dataBuffer);
                    modelStore.updateState(ModelState.FILE_LOADING);
                    return new String(bytes, StandardCharsets.UTF_8);
                })
               .flatMap(chunk -> Flux.fromArray(chunk.split("\n")))
               .skip(1)
               .collectList()
               .map((lines) -> {
                   var ctx = initialCtx;
                   for ( String line: lines) {
                       String[] columns = line.split(",");
                       if (columns.length != 2) return ctx;
                       //NumberFormatException en caso de fallar
                       Double mileage = Double.parseDouble(columns[0].trim());
                       Double price = Double.parseDouble(columns[1].trim());
                       ctx = ctx.addXDom(mileage)
                               .addYDom(price)
                               .incrementN()
                               .addVector2s(new Vector2(mileage, price));
                   }
                   modelStore.updateState(ModelState.FILE_LOADING);
                   return ctx;
               })
               .doOnSuccess(data -> {
                   modelStore.updateState(ModelState.FILE_PROCESSED);
                   modelStore.setTrainCtx(data);
               })
                .map(ctx -> ResponseEntity.ok().body(ctx.vector2s()))
                .onErrorResume( err -> {
                    modelStore.updateState(ModelState.ERROR_FILE);

                    return Mono.just(ResponseEntity.badRequest().build());

                });
    }
}
