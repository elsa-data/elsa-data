
WITH
    # the job
    paramJobId := <uuid>$jobId,

    #
    paramNewSpecimens := <array<uuid>>$newSpecimens,

    #
    paramNewMessages := <array<str>>$newMessages,

    #######

    newSpecimens := (SELECT dataset::DatasetSpecimen FILTER .id IN array_unpack(paramNewSpecimens))


UPDATE job::SelectJob
FILTER .id = paramJobId
SET {
    messages := .messages ++ paramNewMessages,
    selectedSpecimens += newSpecimens
}

