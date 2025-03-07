module storage {

    scalar type ChecksumType extending enum<'MD5', 'AWS_ETAG', 'SHA_1', 'SHA_256'>;

    type File {
        required property url -> str {
            readonly := true;

            constraint exclusive on (str_lower(__subject__));

            # look this isn't really going to catch much - but in reality URLs aren't urls if they
            # are less than 6 characters - maybe replace with weak regex

            constraint min_len_value(5);
        }

        required property size -> int64;

        required property checksums -> array<tuple<type: ChecksumType, value: str>>;

        # This would be useful to identify file that has been deleted by the submitter.
        # We won't be deleting the actual record to prevent with any record linking
        # Instead a flag to identify if data has been deleted.
        required property isDeleted -> bool {
            default := false;
        }
    }
}
